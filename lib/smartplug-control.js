const request = require('request');
const MerossCloud = require('@kronsi/meross-cloud');
module.exports = function(RED) {
	'use strict';

	function SmartPlugNode(node) {		
		RED.nodes.createNode(this, node);
		this.config = RED.nodes.getNode(node.confignode);
		//console.log("this.config", this.config);
		console.log("SmartPlugNode");

		//if(deviceDefList.length == 0){

			let connected = 0;
			//internal server error
			/*

			if(this.config.username.length > 0 && this.config.password.length >0 &&){
				const options = {
					email: this.config.username,
					password: this.config.password,
					logger: console.log,
					localHttpFirst: false, // Try to contact the devices locally before trying the cloud
					onlyLocalForGet: true, // When trying locally, do not try the cloud for GET requests at all
					timeout: 3000 // Default is 3000
				};			
				const meross =new MerossCloud(options);
				
				//console.log("meross", meross)
			}
			
			meross.on('deviceInitialized', (deviceId, deviceDef, device) => {	
				deviceDefList.push(deviceDef);
				deviceList.push(device);
				console.log('New device ' + deviceId + ': ' , deviceDef);
				//console.warn('device: ', device);					
			});
			meross.on('connected', (deviceId) => {
				console.log(deviceId + ' connected');
			});
			
			meross.on('close', (deviceId, error) => {
				console.log(deviceId + ' closed: ' + error);
			});
			
			meross.on('error', (deviceId, error) => {
				console.log(deviceId + ' error: ' + error);
			});
			
			meross.on('reconnect', (deviceId) => {
				console.log(deviceId + ' reconnected');
			});
			
			meross.on('data', (deviceId, payload) => {
				console.log(deviceId + ' data: ', payload);
			});

			meross.connect(node.device,(error) => {
				console.log('connect error: ' + error);
			});
			*/
		//}
		let meross = null;
		let currentDevices = [];
		this.on('input', (msg, send) => {
			console.log("node", node);
			//console.log("msg", msg);
			
			function pushMessage(_devices){
				let messages = [];
				for(let i=0; i < _devices.length; i++){
					switch(node.action){
						case 'onoff':
							_devices[i].getSystemAllData((err, res) => {
								//console.log('All-Data: ', res.all.digest);
								messages.push(
									{
										payload: {
											deviceName: _devices[i].dev.devName,
											...res.all	
										}
									}
								);
								if( _devices.length == messages.length ){
									send(messages);
								}								
							});
							break;
						case 'energy':
							_devices[i].getControlElectricity((err,res)=> {
								//console.log("electricity res", res);
								//console.log("_devices[i]", _devices[i]);
								
								messages.push(
									{
										payload: {
											deviceName: _devices[i].dev.devName,
											...res.electricity	
										}
									}
								);
								if( _devices.length == messages.length ){
									send(messages);
								}
							});
							break;
					}
					
				}
			}

			if(!meross){
				if(this.config.username.length > 0 && this.config.password.length > 0){
					const options = {
						email: this.config.username,
						password: this.config.password,
						logger: console.log,
						localHttpFirst: false, // Try to contact the devices locally before trying the cloud
						onlyLocalForGet: true, // When trying locally, do not try the cloud for GET requests at all
						timeout: 3000 // Default is 3000
					};			
					meross = new MerossCloud(options);
					meross.on('deviceInitialized', (deviceId, deviceDef, device) => {	
						//console.log('New device ' + deviceId + ': ' , deviceDef);
						currentDevices.push(device);						
						//console.warn('device: ', device);					
					});

					meross.on('close', (deviceId, error) => {
						console.log(deviceId + ' closed: ' + error);
						this.status({fill:"red", shape:"dot", text:"closed"});
					});
					
					meross.on('error', (deviceId, error) => {
						console.log(deviceId + ' error: ' + error);
						this.status({fill:"red", shape:"dot", text:"error"});
					});
					/*
					experimental
					meross.on('data', (deviceId, payload) => {
						console.log(deviceId + ' data: ', payload);
					});
					*/
					
					meross.connect(node.device.split(","),(error) => {
						console.log('connect error: ' + error);
						if(!error){
							this.status({fill:"yellow", shape:"dot", text:"connecting..."});
							setTimeout(()=> {
								this.status({fill:"green", shape:"dot", text:"connected"});
								pushMessage(currentDevices);
							}, 2000)
						}
					});					
				}
				else {
					//send 401 not auth message
					console.error("401");
					this.status({fill:"red", shape:"dot", text:"Unauthorized"});
				}
			}
			
			
			if( currentDevices && currentDevices.length > 0 ){
				pushMessage(currentDevices);
			}
			else {
				//send device not loaded
				console.error("currentDevice null");
				this.status({fill:"red", shape:"dot", text:"Device Not Found"});
			}
		
			//done();
			
		});
		
	}

	RED.nodes.registerType('meross-device', SmartPlugNode);

	RED.httpAdmin.get(
		"/devices/:nodeid",
		RED.auth.needsPermission("meross-device.write"),
		function(req, res){
			const node = RED.nodes.getNode(req.params.nodeid);			
			if( node ){
				//process.exit();//node.config.username
				let devList = [];
				
				if(node.config.username.length > 0 && node.config.password.length >0 ){
					const options = {
						email: node.config.username,
						password: node.config.password,
						logger: console.log,
						localHttpFirst: false, // Try to contact the devices locally before trying the cloud
						onlyLocalForGet: true, // When trying locally, do not try the cloud for GET requests at all
						timeout: 3000 // Default is 3000
					};			
					const meross = new MerossCloud(options);					
					node.status({fill:"green",shape:"dot",text:"connected"});

					if(devList.length == 0){						
						meross.on('deviceInitialized', (deviceId, deviceDef, device) => {	
							devList.push(deviceDef);
							//console.log('New device ' + deviceId + ': ' , deviceDef);
							//console.log("devicelist.length", devList.length, devCounter)							
						});

						meross.connect((error) => {
							console.log('connect error: ' + error);
							if(Object.keys(meross.devices).length == devList.length){
								res.json(devList);
								meross.logout();
							}
						});
					}
					else {
						res.json(devList);
					}
				}
				else {
					res.sendStatus(401);
					node.status({fill:"red",shape:"ring",text:"Unauthorized"});
				}								
			}
			else {
				res.sendStatus(404);
				node.status({fill:"red",shape:"ring",text:"Not Found"});
			}
		}
	)
};