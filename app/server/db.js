const mongo = require('mongodb').MongoClient
const app = require('../main.js').app;
//const domain = app.get('domain').slice(8, app.get('domain').length-6)
const domain = '127.0.0.1';

class Account {

	#client;
	#root;
	#db_name;

	constructor(id, pass) {
		this._id = id;
		this._pass = pass;
		this._userName, this._charName;
		this.#db_name = Buffer.from(this._id).toString('base64')
		this._url = `mongodb://${domain}:27017/`
		this.#client = new mongo(this._url+this.#db_name, {
			useUnifiedTopology : true,
			auth: {
				user : this._id,
				password : this._pass 
			}
		});
		this.#root = new mongo(this._url+"admin", {
			useUnifiedTopology : true,
			auth: {
				user : "root-admin",
				password : "this.is.my.first.application"
			}
		});
		this.$db;
		this.ondata;
	}

	set userName(name){
		this._userName = name;
	}

	set charName(name){
		this._charName = name;
	}

	onData(cb){
		this.ondata = function(res){
			cb.call(this, res)
		}
	}

	getData(coll) {
		var self = this;
		return new Promise(function(res, rej){
			self.#client.connect(function(err, client){
				if(!err){
					self.$db = client.db(self.#db_name);
					var info = {};
					if (coll){
						self.$db.collection(coll).find().toArray(function(err, result){
							err ? rej(err) : res(result);
						})
					} else {
						const colls = ['basic', 'game'];
						colls.forEach((el, i) => {
							self.$db.collection(el).find().toArray(function(err, result){
								err ? rej(err) : (()=>{
									info[el] = result;
									if(i == colls.length-1){
										res(info)
										return;
									}
								})()
							})
						})
					}
				} else {
					rej(err)
				}
			})
		})
	}

	exists(){
		var self = this;
		return new Promise(function(res, rej){
			self.#root.connect(function(err, db){
				if(!err){
					var admin = db.db('admin');
					admin.collection('system.users').find({user : self._id}).toArray(function(e, docs){
						if(docs.length != 0){
							res(true)
						} else {
							res(false)
						}
					})
				} else {
					rej(null)
				}
			})
		})
	}

	createUser(){
		var self = this;
		return new Promise(function(res, rej){
			self.#root.close();
			self.#root.connect(function(err, client){
				if(!err){
					var newUserDB = client.db(self.#db_name);
					newUserDB.addUser(self._id, self._pass, {
						roles : ['dbOwner']
					}, function(e, result){
						e ? rej(e) : (()=>{
							newUserDB.collection('basic').insertOne({
								display_name : self._userName,
								unique_name : self._id,
								display_pic : self._charName
							})
							newUserDB.collection('creds').insertOne({
								key : self._pass
							})
							newUserDB.collection('game').insertOne({
								game_bal : 500,
								game_won : 0,
								game_lost : 0
							});
							res(true)
						})();
					})
				} else {
					rej(err)
				}
			})
		})
	}

	writeData(col, newData){
		var self = this;
		return new Promise(function(res, rej){
			self.#client.connect(function(err, client){
				if (!err){
					self.$db = client.db(self.#db_name);
					self.$db.collection(col).updateOne({}, {
						$set : newData
					}, function(err, result){
						if(err) rej(err)
						else {
							res(true)
						}
					})
				} else {
					rej(err)
				}
			})
		})
	}
}

class Root {

	static findPending(_uid, cb){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive : false
		}).connect(function(err, cl){
			var pendingdb = cl.db('pending');
			pendingdb.collection('users').find({uid : _uid}).toArray(function(err, docs){
				if (docs.length){
					cb.call(global, true)
				} else {
					cb.call(global, false)
				}
			})
		})
	}

	static addPending(_uid){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive: false
		}).connect(function(err, cl){
			var pendingdb = cl.db('pending');
			pendingdb.collection('users').insertOne({uid : _uid}, function(err, result){
				if (err) throw err
			})
		})
	}

	static deletePending(_uid){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive: false
		}).connect(function(err, cl){
			var pendingdb = cl.db('pending');
			pendingdb.collection('users').deleteOne({uid : _uid}, function(err, result){
				if(err) throw err
			})
		})
	}

	static addActiveUser(userKey, userId, userPass){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive: false
		}).connect(function(err, cl){
			var activeUsersdb = cl.db('activeUser');
			activeUsersdb.collection('users').insertOne({
				'user_key' : userKey,
				'user_id' : userId,
				'user_pass' : userPass
			}, function(err, result){
				if(err) throw err
			})
		})
	}

	static findActiveUser(userKey, cb){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive: false
		}).connect(function(err, cl){
			var activeUsersdb = cl.db('activeUser');
			activeUsersdb.collection('users').findOne({
				'user_key' : userKey
			}, function(err, result){
				if (err) throw err
				else {
					result ? cb(result) : cb(false)
				}
			})
		})
	}

	static deleteActiveUser(userKey, cb){
		new mongo(`mongodb://${domain}:27017/`, {
			useUnifiedTopology: true,
			keepAlive: false
		}).connect(function(err, cl){
			var activeUsersdb = cl.db('activeUser');
			activeUsersdb.collection('users').deleteOne({
				'user_key' : userKey
			}, function(err, result){
				if (err) throw err
			})
		})
	}
}

module.exports.Account = Account;
module.exports.Root = Root;