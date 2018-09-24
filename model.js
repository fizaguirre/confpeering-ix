Offers = new Meteor.Collection('offers');

Offers._encrypted_fields({
  'aspath' : {princ: 'asprinc', princtype: 'as', auth: ['_id']}
});

function ferr(e)
{
  console.log(e);
}


/* trusted IDP: */
idp_app_url("192.168.25.6");
var idp_pub = '8a7fe03431b5fc2db3923a2ab6d1a5ddf35cd64aea35e743' +
              'ded7655f0dc7e085858eeec06e1c7da58c509d57da56dbe6';
idp_init("http://localhost:3010", idp_pub, false);

// use IDP only if active attacker
Accounts.config({sendVerificationEmail:active_attacker()});


if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.methods({
    'getServerTime': function() {
      return + new Date;
    }
  });

  Offers.allow({
  // anyone can insert a new room
  insert: function (userId, doc) {
      return true;
  },
  // only owner can change room
  update: function (userId, doc, fields, modifier) {
      //return doc.createdByID === userId;
      return true;
  },
  // only owner can remove room
  remove: function (userId, doc) {
      //return doc.createdByID === userId;
      return true;
  }
  });
}