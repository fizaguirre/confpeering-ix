Meteor.publish("offers", function(){
    return Offers.find();
  });