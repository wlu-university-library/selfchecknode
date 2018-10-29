# ALMA Self-Check Kiosk App for Node
***Languages***: JavaScript, HTML, CSS

***Requires***: node.js, PostgreSQL

This application uses node.js to host a self-check application for Alma.  Kiosk devices can browse to a central URL that talks to the Alma API to perform circulation activities.  The app stores an anonymised record of use at the point a user signs in with their barcode (user id).  These stats can be accessed at the /stats route for the app.
