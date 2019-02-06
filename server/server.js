//Collections to store offers.
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
	//console.info("looking.. " + ases);
	return Offers.find({createdBy:{$in : ases}});
    //return Offers.find({createdBy:this.userId});
    //return Offers.find();
  });

//Collections to store users.
Meteor.publish("users", function() { 
  return Meteor.users.find({}, {fields: {}});
});

//Collections to store the logical states that are going to be use in proposals.
Meteor.publish("proposalstates", function() {
	return ProposalStates.find({});
});

//Collections to store the logical states that are going to be use in contracts.
Meteor.publish("contractstates", function() {
	return ContractStates.find({});
});

//Collections to store the logical actions that are going to be used in proposals and contracts transitions.
Meteor.publish("workflowactions", function() {
	return WorkflowActions.find({});
});

//Collection to store proposals registers.
Meteor.publish("proposals", function() {
	//return Proposals.find({$or: [{provider: this.userId}, {costumer: this.userId}]}, {sort: { createdAt: -1}, limit: 10});
	return Proposals.find({$or: [{provider: this.userId}, {costumer: this.userId}]});
});

/*Meteor.publish("costumer_proposals", function() {
	return Proposals.find({costumer: this.userId});
});*/

//Collection to store contracts registers.
Meteor.publish("contracts", function() {
	//return Contracts.find({$or: [{provider: this.userId}, {costumer: this.userId}]}, {sort: { createdAt: -1}, limit: 10});
	return Contracts.find({$or: [{provider: this.userId}, {costumer: this.userId}]});
});

//Collection to store AS data registers.
Meteor.publish("asinfo", function() {
	return ASInfo.find();
});

//Collection to store private AS data registers.
Meteor.publish("asprivateinfo", function() {
	return ASPrivateInfo.find({userId: this.userId});
});

//Collection to store AS documents signatures registers.
Meteor.publish("signatures", function() {
	return Signatures.find({});
});

//Collection to store AS score registers.
Meteor.publish("scores", function() {
	return Scores.find({});
})

/*Meteor.publish("costumer_contracts", function() {
	return Contracts.find({costumer: this.userId});
});*/


/*
	Methods used to handle transition atctions for proposals and contracts.
	The methods are defined as follows:
		ShareOffers: Given an offer id and a user id, share the offer with the user provided.
		GetProposalActions: Return the validate actions related to a proposal.
		MoveProposal: Given a proposal ID and its action code, move its status to the new one.
		MoveContract: Given a contract ID and its action code, move its status to the new one.
*/
Meteor.methods({
	'ShareOffers': function(asIDOferer, asIDClient) {
		//db.ases.update({as_id:5}, {$push:{as_oferers:2} }, {upsert:true});
		Ases.update({as_id:asIDClient}, {$push:{as_oferers:asIDOferer} }, {upsert:true});
	},
	'GetProposalActions': function(pId) {
		proposal = Proposals.findOne({_id: pId});

		if(this.userId == proposal.costumer) {
			console.log(WorkflowActions.find({who:"costumer", statecod: proposal.state}).count());
			return WorkflowActions.find({who:"costumer", statecod: proposal.state}).fetch();
		}
		else {
			console.log(WorkflowActions.find({who:"provider", statecod: proposal.state}).count());
			return WorkflowActions.find({who:"provider", statecod: proposal.state}).fetch();
		}
	},
	'MoveProposal': function(pid, action, option) {
		proposal = Proposals.findOne({_id: pid});
		action = WorkflowActions.findOne({cod:action});

		//Check user permissions
		if(action.who == "costumer") {
			if(this.userId != proposal.costumer) {
				console.log("not costumer");
				return false;
			}
		}
		else {
			if (action.who == "provider") {
				if (this.userId != proposal.provider) {
					console.log(this.userId);
					console.log(proposal.provider);
					console.log("not provider");
					return false;
				}
			}
		} 

		switch(action.cod) {
			case 'a_gen_contract':
				console.log('a_gen_contract');
				// Contracts.insert({costumer:proposal.costumer, provider: proposal.provider,
				// 					contdoc: option, state:"c_created"});
				try{
					Proposals.update({_id: proposal._id}, {$set: {state:action.nextstatecod}});	
				}
				catch(err)
				{
					console.log("Failed to update proposal "+ pid)
				}
				break;
			default:
				console.log("proposal default");
				Proposals.update({_id: proposal._id}, {$set: {state:action.nextstatecod}});
				break;
		}
	},
	'MoveContract': function(pid, action) {
		contract = Contracts.findOne({_id: pid});
		action = WorkflowActions.findOne({cod:action});

		switch(action.cod) {
			default:
				try {
					Contracts.update({_id: contract._id}, {$set: {state:action.nextstatecod}});	
				}
				catch(err) {
					console.log("Failed to update contract "+ pid)
				}
				break;
		}
	}
});

//Environment variables to ignore SSL certificate validation.
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0";
console.log("NODE TLS "+process.env.NODE_TLS_REJECT_UNAUTHORIZED)