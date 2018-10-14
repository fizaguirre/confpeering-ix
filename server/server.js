Meteor.publish("offers", function(){
	//db.ases.find({ "as_id": { $in: ["1","2"] } } );
	var ases = [];

	try{
		if(as = Ases.findOne({as_id:this.userId})){
			ases  = ases.concat(as.as_oferers);
		}
	}
	catch(err) {
		console.info(err);
	}
	
	ases.push(this.userId);
	console.info("looking.. " + ases);
	return Offers.find({createdBy:{$in : ases}});
    //return Offers.find({createdBy:this.userId});
    //return Offers.find();
  });

Meteor.publish("users", function() { 
  return Meteor.users.find({}, {fields: {}});
});

Meteor.publish("proposalstates", function() {
	return ProposalStates.find({});
});

Meteor.publish("contractstates", function() {
	return ContractStates.find({});
});

Meteor.publish("workflowactions", function() {
	return WorkflowActions.find({});
});

Meteor.publish("proposals", function() {
	return Proposals.find({$or: [{provider: this.userId}, {costumer: this.userId}]});
});

Meteor.publish("costumer_proposals", function() {
	return Proposals.find({costumer: this.userId});
});

Meteor.publish("contracts", function() {
	return Contracts.find({provider: this.userId});
});

Meteor.publish("costumer_contracts", function() {
	return Contracts.find({costumer: this.userId});
});

Meteor.methods({
	'ShareOffers': function(asIDOferer, asIDClient) {
		//db.ases.update({as_id:5}, {$push:{as_oferers:2} }, {upsert:true});
		Ases.update({as_id:asIDClient}, {$push:{as_oferers:asIDOferer} }, {upsert:true});
	}
});