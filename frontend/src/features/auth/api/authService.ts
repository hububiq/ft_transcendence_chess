// The pure Axios calls for login/register
// It is purely responsible for talking to your Django/FastAPI backend.

// returns Promise (via Axios)
function loginRequest(credentials) {}

// returns Promise (via Axios)
function registerRequest(newUserData) {}

/* 
Define function loginRequest(credentials):
    Return axios.post to "/api/login/" with credentials

Define function registerRequest(newUserData):
    Return axios.post to "/api/register/" with newUserData

Define function fetchCurrentUser():
    Return axios.get to "/api/me/"
*/