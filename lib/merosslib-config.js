module.exports = function(RED) {
	function MerossNode(MyNode) {
		RED.nodes.createNode(this, MyNode);
		this.username = MyNode.username;
        this.password = MyNode.password;		
	}

	RED.nodes.registerType("merosslib-config", MerossNode, {
		username: { type: "text" },
        password: { type: "password" }
	});
};