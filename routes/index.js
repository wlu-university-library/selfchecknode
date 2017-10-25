const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../config.js');
const parseString = require('xml2js').parseString;
const moment = require('moment');
const db = require('../utils/db');
const requestIp = require('request-ip');

router.get ('/', function(req, res) {
  var success, error; 
  if (req.flash('success')) success = req.flash('success');
  if (req.flash('error'))   error   = req.flash('error');
  
  req.session.destroy(function(err) {
    res.render('index', {
      success: success,
      error: error
    });
  });
});

router.post('/', function(req, res) {
  if (req.body.userid) {
    var url = config.baseURL + "almaws/v1/users/" + req.body.userid + "?apikey=" + config.apiKey + "&expand=loans,requests,fees&format=json";
    request(url, function(err, response, body) {
      if (err) {
        req.flash('error', "Unknown error on the server.  Please try again in a few moments.");
        res.redirect('/');
      } 

      var data;

      try {
        data = JSON.parse(body);
      } catch(e) {
        req.flash('error', "Error getting data.  Please try again.");
        res.redirect('/');
      }
      
      if (data && data.errorsExist) {
        req.flash('error', data.errorList.error[0].errorMessage);
        res.redirect('/');
      } else {
        req.session.userid = data.primary_id;
        req.session.checkouts = data.loans.value;
        req.session.barcodes = [];
        req.session.loansurl = data.loans.link;
        res.render('checkout', {
          user: data
        });
      }
    });
  }
});

router.post('/item', function(req, res) {
  if (req.body.barcode) {
    var reqbody = { 
      circ_desk: {
        value: config.circDesk,
      },
      library: {
        value: config.libraryName 
      }
    };

    var url = config.baseURL + "almaws/v1/users/" + req.session.userid + "/loans?user_id_type=all_unique&item_barcode=" + req.body.barcode + "&apikey=" + config.apiKey;

    request({
      method: 'POST',
      url: url,
      body: JSON.stringify(reqbody),
      headers: {
        "Content-Type": "application/json"
      }
    }, function(err, response, body) {
      if (err) console.log(err);

      parseString(body, function (err, data) {
        if (data.errorsExist) {
          req.flash('error', data.errorList.error[0].errorMessage);
          res.redirect('/');
        } else {
          var barcode = data.item_loan.item_barcode[0];
          var title = data.item_loan.title[0];
          var due = moment(data.item_loan.due_date[0]).format('MMMM d, YYYY');
          if (req.session.barcodes.indexOf(barcode) > -1) {
            req.flash('error', "Item has already been checked out.");
            res.send({error: req.flash('error')});
          } else {
            req.session.checkouts++;
            req.session.barcodes.push(barcode);
            var row = "<tr><td>" + title + "</td><td>" + due + "</td></tr>";
            res.send({checkouts: req.session.checkouts, html: row});
          }
        }
      });
    });
  }
});

router.get('/loans', function(req, res) {
  var url = req.session.loansurl + "?apikey=" + config.apiKey + "&format=json";
  request(url, function(err, response, body) {
    if (err) {
      config.log(err);
      res.send({error: err});
    }

    var data;

    try {
      data = JSON.parse(body);
    } catch(e) {
      res.send({error: "Error getting data.  Please try again."});
    }
    
    if (data && data.errorsExist) {
      res.send({error: data.errorList.error[0].errorMessage});
    } else {
      req.app.render('loans', {
        loans: data.item_loan
      }, function(err, html) {
        if (err) {
          console.log(err);
          return res.send({error: err});
        }

        return res.send(html);
      });
    }
  });
});

function getStatsSearchBox(req, res, next) {
  db.run("SELECT DISTINCT station FROM sclog ORDER BY station", function(err, results) {
    if (err) {
      console.log("Error getting stations: " + err);
      req.flash('error', err);
      return res.redirect('/stats');
    }

    req.stations = results;
    return next();
  });
}

function getStatsSummary(req, res, next) {
  var station = (req.params.station === 'ALL') ? "%" : "%" + req.params.station + "%";
  var startdate = req.params.start;
  var enddate = req.params.end;

  db.run("SELECT station, count(*) as sessions, sum(checkouts) as checkouts FROM sclog WHERE station LIKE $1 AND (datetime BETWEEN $2 AND $3) GROUP BY station ORDER BY station", [station, startdate + " 00:00:00", enddate + " 23:59:59"], function(err, results) {
    if (err) {
      console.log("Error querying log: " + err);
      req.flash('error', err.toString());
      return res.redirect('/stats');
    }

    req.statsresults = results;
    req.reptype = "summary";
    return next();
  });
}


function getStatsDetails(req, res, next) {
  var station = (req.params.station === 'ALL') ? "%" : "%" + req.params.station + "%";
  var startdate = req.params.start;
  var enddate = req.params.end;

  db.run("SELECT * FROM sclog WHERE station LIKE $1 AND (datetime BETWEEN $2 AND $3) ORDER BY datetime", [station, startdate + " 00:00:00", enddate + " 23:59:59"], function(err, results) {
    if (err) {
      console.log("Error querying log: " + err);
      req.flash('error', err.toString());
      return res.redirect('/stats');
    }

    req.statsresults = results;
    req.reptype = "detail";
    return next();
  });
}

function renderStatsBox(req, res) {
  var stats = (req.statsresults) ? req.statsresults : null;
  var reptype = (req.reptype) ? req.reptype : null;
  res.render('stats', {
    error: req.flash('error'),
    stations: req.stations,
    stats: stats,
    reptype: reptype,
    stationlist: req.params.station,
    startdate: req.params.start,
    enddate: req.params.end,
    laststation: req.params.station,
    stationgroups: config.stationGroups
  });
}

router.get('/stats', getStatsSearchBox, renderStatsBox);
router.get('/stats/:station/:start/:end', getStatsSearchBox, getStatsDetails, renderStatsBox);  
router.get('/stats/summary/:station/:start/:end', getStatsSearchBox, getStatsSummary, renderStatsBox);  

router.post('/logout', function(req, res) {
  console.log("Logout called");
  var localTime  = moment.utc().toDate();
  var clientIp = requestIp.getClientIp(req);
  if (clientIp.startsWith(":")) {             // Strip off IPv6 header
    clientIp = clientIp.substr(7);
  }
  localTime = moment(localTime).format('YYYY-MM-DD HH:mm:ss');
  db.run("INSERT INTO sclog (ipaddress, station, datetime, checkouts) VALUES ($1, COALESCE((SELECT name FROM stations WHERE ipaddress = '" + clientIp + "'), 'Unknown'), $2, $3)", [clientIp, localTime, req.session.barcodes.length], function(err, results) {
    if (err) {
      console.log("Error saving log to database: " + err);
      return res.redirect('/');
    }
    
    req.flash('success', true);
    return res.redirect('/');
  });
});

module.exports = router;