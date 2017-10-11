module.exports = { 
  baseURL: "https://api-na.hosted.exlibrisgroup.com/",
  apiKey: "",
  libraryName: "",
  circDesk: "",
  dbstring: "postgres://USER:PASS@HOST:5432/DB?ssl=false",
  stationGroups: []
};

/*
    stationGroups is a set of arrays that group together stations in the dropdown for the stats module.  The value should look similar to:

    [
      [
        { 
          code: "LAW",
          desc: "All Law"
        },
        { 
          code: "UNIV",
          desc: "All Undergraduate"
        }
      ],
      [
        { 
          code: "MAIN",
          desc: "All Main"
        },
        {
          code: "SCIENCE",
          desc: "All Science"
        }
      ]
    ]
*/