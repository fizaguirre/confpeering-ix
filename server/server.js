Meteor.publish("offers", function(){
	//db.ases.find({ "as_id": { $in: ["1","2"] } } );
	var ases = [];

	try{
		oferers = Ases.findOne({as_id:this.userId}).as_oferers;		
		ases  = ases.concat(oferers);
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

Meteor.publish("ases", function() { 
  //return Ases.find({as_id:this.userId});
  return Ases.find();
});

Meteor.methods({
	'ShareOffers': function(asIDOferer, asIDClient) {
		//db.ases.update({as_id:5}, {$push:{as_oferers:2} }, {upsert:true});
		Ases.update({as_id:asIDClient}, {$push:{as_oferers:asIDOferer} }, {upsert:true});
	}
})