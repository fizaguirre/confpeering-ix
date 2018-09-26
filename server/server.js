Meteor.publish("offers", function(){
    return Offers.find({createdBy:this.userId});
    //return Offers.find();
  });

Meteor.publish("users", function() { 
  return Meteor.users.find({}, {fields: {}});
});