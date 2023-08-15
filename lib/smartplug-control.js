const request = require('request');
const MerossCloud = require('@kronsi/meross-cloud');
const deviceFilter = ["mss310", "mss210"];
module.exports = function(RED) {
	'use strict';

	function SmartPlugNode(node) {		
		RED.nodes.createNode(this, node);
		this.config = RED.nodes.getNode(node.confignode);
		let meross = null;
		//if(deviceDefList.length == 0){

			
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
		
		let currentDevices = [];
		
		this.on('input', (msg, send) => {
			//console.log("node", node);
			//console.log("msg", msg);
			
			function pushMessage(_devices){
				let messages = [];
				let called = 0;
				//console.log("_devices.length", _devices.length);

				function call(){
					called++;
					if(called == _devices.length){
						send(messages);
					}
				}
				for(let i=0; i < _devices.length; i++){
					//console.log("_devices[i]", _devices[i]);
					switch(node.action){
						case 'state':
							_devices[i].getSystemAllData((err, res) => {
								//console.log('All-Data: ', res.all);
								messages.push(
									{
										payload: {
											deviceName: _devices[i].dev.devName,
											deviceDetails: _devices[i].dev,
											...res.all	
										}
									}
								);
								
								//console.log("length=length", _devices.length, messages.length )	
								call();							
							});
							break;
						case 'energy':
							_devices[i].getControlElectricity((err,res)=> {
								//console.log("electricity res", res);
								//console.log("_devices[i]", _devices[i]);
								if(res && res.electricity){
									messages.push(
										{
											payload: {
												deviceName: _devices[i].dev.devName,
												deviceDetails: _devices[i].dev,
												...res.electricity	
											}
										}
									);
									
								}
								//console.log("length=length", _devices.length, messages.length )
								call();
							});
							break;
						case 'on':
							_devices[i].controlToggleX(0, 1, (err,res)=> {
								//console.log("res", res);
								//console.log("_devices[i]", _devices[i]);
								if(res){
									messages.push(
										{
											payload: {
												deviceName: _devices[i].dev.devName,
												deviceDetails: _devices[i].dev,
												state: "on"
											}
										}
									);
									
								}
								//console.log("length=length", _devices.length, messages.length )
								call();
							});
							break;
						case 'off':
							_devices[i].controlToggleX(0, 0, (err,res)=> {
								//console.log("res", res);
								//console.log("_devices[i]", _devices[i]);
								if(res){
									messages.push(
										{
											payload: {
												deviceName: _devices[i].dev.devName,
												deviceDetails: _devices[i].dev,
												state: "off"
											}
										}
									);
									
								}
								//console.log("length=length", _devices.length, messages.length )
								call();
							});
							break;						
					}
					
					
				}
			}
			//console.log("meross", meross);
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
						//console.log('deviceInitialized' + deviceId + ': ' , deviceDef);
						if(deviceFilter.includes(deviceDef.deviceType)){
							currentDevices.push(device);				
						}		
						//console.warn('device: ', device);					
					});

					meross.on('close', (deviceId, error) => {
						//console.log(deviceId + ' closed: ' + error);
						this.status({fill:"red", shape:"dot", text:"closed"});
					});
					
					meross.on('error', (deviceId, error) => {
						//console.log(deviceId + ' error: ' + error);
						this.status({fill:"red", shape:"dot", text:"error"});
					});
					
					//experimental
					meross.on('data', (deviceId, payload) => {
						console.log(deviceId + ' data: ', payload);
					});
					
					
					meross.connect(node.device.split(","),(error) => {
						if( error ){
							console.log('connect error: ' + error);
						}
						this.status({fill:"yellow", shape:"dot", text:"connecting..."});
						if(!error){							
							setTimeout(()=> {
								this.status({fill:"green", shape:"dot", text:"connected"});
								pushMessage(currentDevices);
							}, 1500)
						}
						else {
							setTimeout(()=> {
								this.status({fill:"red", shape:"dot", text:"not connected, connection err"});								
							}, 1500)
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
				//try again, next step
				currentDevices = [];
				meross = null;
			}
		
			//done();
			
		});
		
	}

	RED.nodes.registerType('meross-smartplug', SmartPlugNode);

	RED.httpAdmin.get(
		"/devices/:nodeid",
		RED.auth.needsPermission("meross-smartplug.write"),
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
							//console.log('deviceInitialized ' + deviceId + ': ' , deviceDef);
							if(deviceFilter.includes(deviceDef.deviceType)){
								devList.push(deviceDef);				
							}							
							//console.log('New device ' + deviceId + ': ' , deviceDef);
							//console.log("devicelist.length", devList.length, devCounter)							
						});

						meross.connect((error) => {
							console.log('connect error: ' + error);
							let deviceCounter = 0;
							for(let key in meross.devices){
								if(deviceFilter.includes(meross.devices[key].dev.deviceType)){
									deviceCounter++;
								}
							}
							if(deviceCounter == devList.length){
								res.json(devList);
								//meross.logout();
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