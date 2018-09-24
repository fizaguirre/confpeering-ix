Meteor.publish("offers", function(){
    return Offers.find({createdBy:this.userId});
  });

Meteor.publish("users", function() { 
  return Meteor.users.find({}, {fields: {}});
});