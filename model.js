Offers = new Meteor.Collection('offers');
Ases   = new Meteor.Collection('ases');

search_enable = function() {
  return (typeof MYLAR_USE_SEARCH != "undefined");
}

if(search_enable()) {
  console.info("Search enable");
  Offers._encrypted_fields({
  'aspath'        :{princ: 'asprinc', princtype: 'as', attr: 'SEARCHABLE', auth: ['_id']},
  'bwidth'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'latency'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'pkt_loss'      :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'jitter'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'repair'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'guarantee'     :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'availability'  :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'billing'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'ingress'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'egress'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
  'lengh'         :{princ: 'asprinc', princtype: 'as', auth: ['_id']}
});
} else {
  console.info("Search disable");
  Offers._encrypted_fields({
    'aspath'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'bwidth'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'latency'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'pkt_loss'      :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'jitter'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'repair'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'guarantee'     :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'availability'  :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'billing'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'ingress'       :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'egress'        :{princ: 'asprinc', princtype: 'as', auth: ['_id']},
    'lengh'         :{princ: 'asprinc', princtype: 'as', auth: ['_id']}
  });
}


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

  Ases.allow({
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
      return false;
  }
  });

  filter = function(userID) {
    var ases = [];
    ases.push({createdBy: userID});

    //Looking for ASes it has access to
    try{
      if(as = Ases.findOne({as_id:userID})){
        //ases  = ases.concat(as.as_oferers);
        _.each(as.as_oferers, function(as) {
          ases.push({createdBy: as});
        });
      }
    }
    catch(err) {
      console.info(err);
    }
    
    _.each(ases, function(as){
      console.log("adding as " + as);
    })
    //return Offers.find({createdBy:{$in : ases}});
    return ases;
  }

  if(search_enable()) {
    Offers.publish_search_filter("search-offers", filter);
  }
}