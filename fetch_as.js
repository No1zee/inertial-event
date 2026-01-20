const https = require('https');

const url = "https://api.themoviedb.org/3/discover/tv?api_key=0e32674bae6ecae7dcbf20a4e47790a7&with_networks=80&sort_by=popularity.desc";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log("Total Results:", json.total_results);
        console.log("Results Sample:", json.results.slice(0, 5).map(r => r.name));
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
