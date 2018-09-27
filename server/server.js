Meteor.publish("offers", function(){
	//db.ases.find({ "as_id": { $in: ["1","2"] } } );
	var ases = Ases.find({as_id:this.userId});
	console.info(ases.as_oferers);
	//return Offers.find({createdBy:{$in : ases}});
    //return Offers.find({createdBy:this.userId});
    //return Offers.find();
  });

Meteor.publish("users", function() { 
  return Meteor.users.find({}, {fields: {}});
});

Meteor.publish("ases", function() { 
  return Meteor.ases.find({as_id:this.userId});
});

Meteor.methods({
	'ShareOffers': function(asIDOferer, asIDClient) {
		//db.ases.update({as_id:5}, {$push:{as_oferers:2} }, {upsert:true});
		Ases.update({as_id:asIDClient}, {$push:{as_oferers:asIDOferer} }, {upsert:true});
	}
})