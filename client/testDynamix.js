function ferr(e)
{
  console.log(e);
}

if (Meteor.isClient) {

  Deps.autorun(function(){
    Meteor.subscribe('offers');
    Meteor.subscribe('users');
  });

  Template.hello.greeting = function () {
    return "Welcome to testDynamix.";
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    },
    'click .logout': function(evt) {
      
      evt.preventDefault();
      Meteor.logout(function(error){
        if(error) {
          console.log(error.reason);
        }
      });
    }
  });

  Template.register.events({
    'submit form': function(evt) {
      evt.preventDefault();

      var registerUser = {
        username: evt.target.emailReg.value,
        email: evt.target.emailReg.value,
        password: evt.target.passlReg.value
      }

      Accounts.createUser(registerUser, function(error){
        if(Meteor.user())
        {
          console.log(Meteor.user());
          Principal.create("as","as_" + Meteor.user().username + "_offers", Principal.user(), ferr)
        }
        else
        {
          console.log(error.reason);
        }
      })
    }
  });

  Template.login.events({
    'submit form': function(evt) {
      evt.preventDefault();

      Meteor.loginWithPassword({email:evt.target.emailLogin.value}, evt.target.passwordLogin.value,
        function(error) {
          if(Meteor.user()){
            console.log(Meteor.user());
            console.log(Principal.user());
          }
          else {
            console.log(error.reason);
          }
        });
    }
  });

  Template.registerAnOffer.events({
    'submit form': function(evt) {
      evt.preventDefault();

      _aspath = evt.target.aspath.value;
      _userId = Meteor.user().userId;
      _createdAt = '';

      //Meteor.call('getServerTime', function(e, r) { _createdAt = r; });


      Principal.lookup([new PrincAttr("as", "as_" + Meteor.user().username + "_offers")],
                        Meteor.user().username,
                        function(userPrincipal) {
                          Offers.insert({
                            userId: _userId,
                            asprinc: userPrincipal.id,
                            aspath: _aspath,
                            createdBy: Meteor.userId(),
                            createdAt: + new Date()
                            });
                        });

      evt.target.aspath.value = '';
    }
  });

  Template.offer.offers = function() {
    return Offers.find({createdBy:Meteor.userId()});
    //return Offers.find();
  };

}