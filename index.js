/**
 * Module dependencies.
 */

var express = require('express'), app = express(), api = express();
var nconf = require('nconf');
nconf.file({ file: './config.json' });
var host = nconf.get('cassandra')['ip'] + ':9160';

// app middleware

app.use(express.static(__dirname + '/public'));

// api middleware

api.use(express.logger('dev'));
api.use(express.bodyParser());

/**
 * CORS support.
 */

api.all('*', function(req, res, next) {
	if (!req.get('Origin'))
		return next();
	// use "*" here to accept any origin; we'll do this for now'
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, POST');
	res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
	// res.set('Access-Control-Allow-Max-Age', 3600);
	if ('OPTIONS' == req.method)
		return res.send(200);
	next();
});

api.post('/api/device/:device_id/data', function(req, res) {
	// var Connection = require('cassandra-client').Connection;
	//
	// var conn = new Connection({
	// host : '127.0.0.1',
	// port : 9160,
	// keyspace : 'ambient'
	// });
	//
	// console.log(conn);
	//
	// conn.connect(function(err) {
	// if (err) {
	// console.log('error connecting to casandra')
	// throw err;
	// }
	// // var cql = "SELECT * FROM time_series";
	// var cql = "INSERT INTO time_series (device_id, duration, ab_day, ab_minute, hz_min, hz_max, hz_mean, hz_std_dev, db_min, db_max, db_mean, db_std_dev, f_min, f_max, f_mean, f_std_dev, c02_min, c02_max, c02_mean, c02_std_dev) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
	// console.log(cql);
	// conn.execute(cql, ['1', '15', '150', '30', 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5], function(err, rows) {
	// if (err) {
	// throw err;
	// }
	// console.log(rows);
	// conn.close();
	// });
	// });

	// var helenus = require('helenus'), pool = new helenus.ConnectionPool({
		// hosts : [host],
		// keyspace : 'ambient_box',
		// timeout : 3000,
		// cqlVersion : '3.0.0' // specify this if you're using Cassandra 1.1 and want to use CQL 3
	// });
// 
	// pool.on('error', function(err) {
		// console.error(err.name, err.message);
	// });
// 
	// pool.connect(function(err) {
		// if (err) {
			// console.log('error connecting to casandra')
			// throw err;
		// }
		// // var cql = "SELECT * FROM time_series";
		// var cql = "INSERT INTO time_series (device_id, duration, ab_day, ab_minute, hz_min, hz_max, hz_mean, hz_std_dev, db_min, db_max, db_mean, db_std_dev, f_min, f_max, f_mean, f_std_dev, c02_min, c02_max, c02_mean, c02_std_dev, lm_min, lm_max, lm_mean, lm_std_dev) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
		// console.log(cql);
		// pool.cql(cql, ['1', '15', 150, 45, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6], function(err, results) {
			// if (err) {
				// throw err;
			// }
			// pool.close();
		// });
	// });

	console.log(req.body);
	res.send(201);
});

api.get('/api/test', function(req, res) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write("Hello World");
	res.end();
});

api.get('/api/device/:device_id/data', function(req, res) {
	var helenus = require('helenus'), pool = new helenus.ConnectionPool({
		hosts : [host],
		keyspace : 'ambient_box',
		timeout : 3000,
		cqlVersion : '3.0.0' // specify this if you're using Cassandra 1.1 and want to use CQL 3
	});

	pool.on('error', function(err) {
		console.error(err.name, err.message);
	});

	pool.connect(function(err) {
		if (err) {
			console.log('error connecting to casandra')
			throw err;
		}
		var cql = "SELECT * FROM time_series where device_id = ?";
		console.log(cql + " - " + req.params.device_id);
		pool.cql(cql, [req.params.device_id], function(err, results) {
			if (err) {
				throw err;
			}
			console.log(results);
			res.send(results);
			pool.close();
		});
	});
});

api.get('/api/device/:device_id/ab_day/:ab_day/data', function(req, res) {
	var ret = {};
	ret['device_id'] = req.params.device_id;
	ret['ab_day'] = req.params.ab_day;
	// ab_day = days since 1/1/2013
	var myDate = new Date(2013, 1, 1);
	myDate.setDate(myDate.getDate() + parseInt(req.params.ab_day));
	ret['ab_date'] = myDate;

	var dateNow = new Date();
	var maxMinutes =   dateNow.getUTCHours()*60 + dateNow.getUTCMinutes();
	if (dateNow.setHours(0,0,0,0) != myDate.setHours(0,0,0,0)) {
		maxMinutes = 23*60 + 45;
	}
	var results = [];
	for (var i = 0; i < Math.ceil(maxMinutes / 15); i++) {
		results[i] = {
			'ab_minute' : 15 * (i + 1),
			'db_music_mean' : Math.random() * 10,
			'db_background_mean' : Math.random() * 10,
			'lm_mean' : Math.random() * 1000,
			'f_mean' : Math.random() * 100,
			'people_mean' : Math.random() * 40,
			'ambient_score' : 1 + (Math.random() * 9),
		}
	}
	ret['count'] = results.length;
	ret['results'] = results;
	res.send(ret);
});

app.listen(4000);
api.listen(4001);

console.log('app listening on 4000');
console.log('api listening on 4001');
console.log('connecting to CX at ' + host);
