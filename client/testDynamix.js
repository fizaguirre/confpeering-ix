function ferr(e)
{
  console.log(e);
}


/*
Generate a hash to simulate the the contrat or proposals.
*/
function generateHash() {
  //return Math.random().toString(36).substring(7);
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

var searchKey = '';

/*
Code to be executed in the client side.
*/
if (Meteor.isClient) {

  //Subscribe to the following collections.
  Deps.autorun(function(){
    Meteor.subscribe('offers');
    Meteor.subscribe('users');
    Meteor.subscribe('proposalstates');
    Meteor.subscribe('contractstates');
    Meteor.subscribe('proposals');
    Meteor.subscribe('contracts');
    Meteor.subscribe('workflowactions');
    Meteor.subscribe('asinfo');
    Meteor.subscribe('asprivateinfo');
    Meteor.subscribe('signatures');
    Meteor.subscribe('scores');
  });

  Template.hello.greeting = function () {
    return "Welcome to testDynamix.";
  };

  //Logout event
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

  /*
  
  Event to process the user registration

  It first collect the user data from the form.
  It then pass those values to the function Accounts.create user and wait for the server response.
  It also creates a cryptography key pair for signing documents.

  */
  Template.register.events({
    'submit form': function(evt) {
      evt.preventDefault();

      var registerUser = {
        username: evt.target.emailReg.value,
        email: evt.target.emailReg.value,
        password: evt.target.passlReg.value
      }

      userKeys = null;
      genUserKeyPair().then(function(k) { userKeys = k;});

      Accounts.createUser(registerUser, function(error){
        if(Meteor.user())
        {
          console.log(Meteor.user());
          Principal.create("as","as_" + Meteor.user().username + "_offers", Principal.user(), ferr);

          //Generate and store in the database the user key pair.
          genUserKeyPair().then(function(k) {

            window.crypto.subtle.exportKey("jwk", k.privateKey).then(
              function(_pk) {
                ASPrivateInfo.insert({userId: Meteor.userId(), pk: JSON.stringify(_pk), userprinc: Meteor.user()._pk});
                //ASPrivateInfo.insert({userId: Meteor.userId(), pk: JSON.stringify(_pk)});
                console.log(_pk);
              });

            window.crypto.subtle.exportKey("jwk", k.publicKey).then(
              function(_pubk) {
                ASInfo.insert({userId: Meteor.userId(), pubk: JSON.stringify(_pubk)});
                console.log(_pubk);
              });
          });
        }
        else
        {
          console.log(error.reason);
        }
      })
    }
  });

  //Loggin event
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

  /*

  These event is called once the user fills the offer form and submit it to the server.
  The function bellow takes the values provided in the form and stores it in the server.

  */
  Template.registerAnOffer.events({
    'submit form': function(evt) {
      evt.preventDefault();


      var _aspath = evt.target.aspath.value;
      var _bwidth = evt.target.bwidth.value;
      var _latency = evt.target.latency.value;
      var _pkt_loss = evt.target.pkt_loss.value;
      var _jitter = evt.target.jitter.value;
      var _repair = evt.target.repair.value;
      var _guarantee = evt.target.guarantee.value;
      var _availability = evt.target.availability.value;
      var _billing = evt.target.billing.value;
      var _ingress = evt.target.ingress.value;
      var _egress = evt.target.egress.value;
      var _lengh = evt.target.lengh.value;
      
      var _signature = null;

      var _userId = Meteor.userId();
      var _createdAt = '';

      //Meteor.call('getServerTime', function(e, r) { _createdAt = r; });

      /*

      To register an offer it first lookup to find the principle to be used to cipher the offer document
      that is going to be stored in the database.
      It then inserts the offer in the database in the Offers collection, sign it and store the signature in the Signatures collection.

      */

      Principal.lookup([new PrincAttr("as", "as_" + Meteor.user().username + "_offers")],
                        Meteor.user().username,
                        function(userPrincipal) {
                          var _offer = {
                            userId: _userId,
                            asprinc: userPrincipal.id,
                            aspath: _aspath,
                            bwidth: _bwidth,
                            latency: _latency,
                            pkt_loss: _pkt_loss,
                            jitter: _jitter,
                            repair: _repair,
                            guarantee: _guarantee,
                            availability: _availability,
                            billing: _billing,
                            ingress: _ingress,
                            egress: _egress,
                            lengh: _lengh,
                            createdBy: _userId,
                            createdAt: + new Date() };


                          //Insert the offer in the database
                          var _offerId = Offers.insert(_offer);
                          var _offerRegister = Offers.findOne({_id: _offerId});

                          //Sign the offer and insert the signature in the database
                          getUserPrivateKey().then(function(_pk) {
                            signDocument(_pk,_offerId).then(function(signedDoc) {
                              var buffer = new Uint8Array(signedDoc);
                              Signatures.insert({userId: Meteor.userId(), docId:_offerId, signature: btoa(buffer),
                                                createdBy: Meteor.userId(), createdAt: + new Date()},
                                                function() {
                                                  alert("Offer registered");
                                                });
                            });
                          });
                        });


      evt.target.aspath.value = '';
      evt.target.bwidth.value = '';
      evt.target.latency.value = '';
      evt.target.pkt_loss.value = '';
      evt.target.jitter.value = '';
      evt.target.repair.value = '';
      evt.target.guarantee.value = '';
      evt.target.availability.value = '';
      evt.target.billing.value = '';
      evt.target.ingress.value = '';
      evt.target.egress.value = '';
      evt.target.lengh.value= '';
    }
  });

  /*

  The event bellow process the share offer feature.
  To share an offer, the one that is sharing the offer must provide the username of the user
  that should have access to the specific offer.
  It uses the Principal.add_access function to share the offer with another user.

  */
  Template.shareOffers.events({
    'submit form': function(evt) {
      evt.preventDefault();

      var partnerUserId = Meteor.users.findOne({username: evt.target.as_share.value});

      /*

      To share an offer it perform the following actions:
      1) Lookup for the user principal that is going to have access to the offer.
      2) Lookup for the principal that is sharing the offer.
      3) With the above information executes the function Principal.add_access().

      */

      if(partnerUserId) {
        Principal.lookup([new PrincAttr("as", "as_" + Meteor.user().username + "_offers")],
                    Meteor.user().username,
                    function(offersPrinciple) {
                      Principal.lookupUser(evt.target.as_share.value,
                        function(asSharePrinciple) {
                          Principal.add_access(asSharePrinciple, offersPrinciple,
                            function() {
                              evt.target.as_share.value = '';
                              console.log("Access granted");
                              alert("Offer shared with user");
                            })
                        })
                    });

        Meteor.call('ShareOffers', Meteor.userId(), partnerUserId._id);
        console.log("Added " + partnerUserId._id + "to partners.");
      }
      else
      {
        alert("AS user does not exist");
      }
      evt.target.as_share.value = "";
    
    }
  });

  displayResults = function() {
    console.log("search happend");
  }

  // Show searched offers
  Template.searchOffersResult.offersResult = function() {
    var search_tag = Session.get("search_tag");
    if(search_tag) {    
        return Offers.find({_tag : search_tag});
    }
    return Offers.find({_tag: "nothing"});
  }

  //Search for offers
  Template.searchOffers.events({
    'submit form': function(evt) {
      evt.preventDefault();
      var searchField = evt.target.aspath3.value;
      Offers.search("search-offers", {aspath: searchField}, Principal.user(), Meteor.userId(), displayResults);
      console.log("Searching "+ searchField);
    }
  });

  /*

  The following events process the action of sending a proposal to an user and verify its signature.

  */
  Template.searchOffersResult.events({
    /*
  
    Sending a proposal to a user is to add a register in the database shared with the intended user.
    First the user that is sending the proposal creates a document with the proposal and inserts
    it  into the database. Then, it shares this document with the intended user. For that to take place
    it creates a shared principle with the user that intents to send the proposal.

    */
    'click .sendProposal': function(evt) {
      evt.preventDefault();

      var proposalDoc = generateHash();

      var offer = Offers.findOne({_id: evt.target.value});
      var user02 = Meteor.users.findOne({_id: offer.createdBy});
      // Proposals.insert({costumer: Meteor.userId(), provider: offer.createdBy, offer_id: offer._id,
      //                   propdoc: proposalDoc, state: "p_open"});

      var princ = checkSharedPrincipalExists(Meteor.user().username, user02.username, "proposal");
      console.log(princ);


      if(princ === null) {
        createSharedPrincipal(Meteor.user().username, user02.username, "proposal", function(){
          princ = checkSharedPrincipalExists(Meteor.user().username, user02.username, "proposal");
          Proposals.insert({costumer: Meteor.userId(), provider: offer.createdBy, offer_id: offer._id,
                        propdoc: proposalDoc, propprinc: princ.id, state: "p_open",
                        createdBy: Meteor.userId(), createdAt: + new Date()},
                        function (e,id) {
                          alert("Proposal " + id + " sent to provider.");
                        });
        });
      }
      else {
        Proposals.insert({costumer: Meteor.userId(), provider: offer.createdBy, offer_id: offer._id,
                        propdoc: proposalDoc, propprinc: princ.id, state: "p_open",
                      createdBy: Meteor.userId(), createdAt: + new Date()},
                      function(e,id) {
                          alert("Proposal " + id + " sent to provider.");
                        });
      }


    },
    'click .verfyOfferSignature' : function(evt) {
      evt.preventDefault();
      var oid = evt.target.value;

      var offer = Offers.findOne({_id: oid});
      var offerSignature = Signatures.findOne({docId: oid});
      var signature = new Uint8Array(JSON.parse("[" + atob(offerSignature.signature) + "]"));
      getUserPublicKey(offerSignature.userId).then(function(upubk) {
        verifyDocumentSignature(upubk, signature, offer._id).then(function(isvalid) {
          if(isvalid) {
            alert("valid signature");
          }
          else {
            alert("not valid signature");
          }
        });
      });
    }
  });

  //Get offers that the user has access.
  Template.offer.offers = function() {
    return Offers.find({createdBy:Meteor.userId()});
    //return Offers.find();
  };

  //Get the proposals available to the user.
  Template.proposals.proposal = function() {
    //return Proposals.find({$or: [{costumer : Meteor.userId()}, {provider : Meteor.userId()}]});
    //return Offers.find();
    //return Proposals.find({},{sort: { createdAt: 1}});
    return Proposals.find({});
  };

  /*
  The function bellow check which actions are available to the current user.
  If the user is a costumer it can send proposals and verify it's status.
  If the user is a provider it can accept proposals and generate contracts from that.
  */
  Template.proposals.actions = function(pid) {
    var proposal = Proposals.findOne({_id:pid});
    
    if(Meteor.userId() == proposal.costumer) {
      return WorkflowActions.find({$and: [{who:"costumer"}, {statecod:proposal.state}]});
    }
    else if(Meteor.userId() == proposal.provider) {
      return WorkflowActions.find({$and: [{who:"provider"}, {statecod:proposal.state}]});
    }
  };

  //Get the proposal state
  Template.proposals.states = function(state_cod) {
    return ProposalStates.findOne({cod:state_cod});
  };

  /*
    The proposalAction event handles the transition from one state to another.
    The actions can be as follows:
      a_accept_proposal: Accepts a proposal.
      a_reject_proposal: Rejects a proposal.
      a_gen_contract: Generate a contract from an accepted proposal.
  */
  Template.proposals.events({
    'click .proposalAction': function(evt) {
      evt.target.disabled = true;
      evt.target.hidden = true;
      var _values  = evt.target.value.split("|");
      var _id = _values[0];
      var state = _values[1];

      switch(state)
      {
        case 'a_accept_proposal':
          console.log("call accept proposal");
          pid = _id;
          Meteor.call('MoveProposal', pid, 'a_accept_proposal');
          break;
        case 'a_reject_proposal':
          console.log("call reject proposal");
          pid = _id;
          Meteor.call('MoveProposal', pid, 'a_reject_proposal');
          break;
        case 'a_gen_contract':
          console.log("call a_gen_contract");
          var pid = _id;
          var proposal = Proposals.findOne({_id: pid});
          var costumer = Meteor.users.findOne({_id: proposal.costumer});

          var princ = checkSharedPrincipalExists(Meteor.user().username, costumer.username, "contract");

          if(princ === null){
            console.log("Creating shared principal for user " + costumer.username);
            createSharedPrincipal(Meteor.user().username, costumer.username, "contract",
              function() {
                  princ = checkSharedPrincipalExists(Meteor.user().username, costumer.username, "contract");
                  console.log("Generating contract from proposal " + pid + " customer " + proposal.costumer + " provider "+ proposal.provider);
                  Contracts.insert({proposalId: pid, costumer:proposal.costumer, provider: proposal.provider,
                    contdoc: generateHash(), contprinc: princ.id, state:"c_created",
                  createdBy: Meteor.userId(), createdAt: + new Date()},
                    function(error,id) {
                      //alert("Principal contract generated. Contract " + id + " generated.");
                    });                
              });
          }
          else {
            console.log("Generating contract from proposal " + pid);
            Contracts.insert({proposalId: pid, costumer:proposal.costumer, provider: proposal.provider,
                  contdoc: generateHash(), contprinc: princ.id, state:"c_created",
                createdBy: Meteor.userId(), createdAt: + new Date()},
                function(error,id) {
                      //alert("Contract " + id + " generated.");
                    });
          }

          Meteor.call('MoveProposal', pid, 'a_gen_contract', generateHash());
          break;
      }
    }
  });

  //Get the contracts available for the current user.
  Template.contracts.contract = function() {
    //return Proposals.find({$or: [{costumer : Meteor.userId()}, {provider : Meteor.userId()}]});
    //return Offers.find();
    //return Contracts.find({},{sort: { createdAt: 1}});
    return Contracts.find({});
  };

  //Get the state of a contract given its code.
  Template.contracts.states = function(state_cod) {
    return ContractStates.findOne({cod:state_cod});
  };

  Template.contracts.isRegistered = function(state_cod) {
    if(state_cod === 'c_registered')
    {
      return true;
    }
    return false;
  }

  //Return true if a contract has been evaluted. Otherwise returns false.
  Template.contracts.evaluated = function(cid) {
    var score = null;
    score = Scores.findOne({contractId: cid, userId: Meteor.userId()});
    //console.log("cid" + cid + "user " + Meteor.userId());
    if(score === undefined) {
      return false;
    }
    return true;
  }

  //Get the score of a given contract.
  Template.contracts.scores = function(cid) {
    //console.log("cid " + cid + " user " + Meteor.userId());
    return Scores.findOne({contractId: cid, userId: Meteor.userId()});
  }

  //Get the actions available for a contract.
  Template.contracts.actions = function(pid) {
    var contract = Contracts.findOne({_id:pid});
    
    if(Meteor.userId() == contract.costumer) {
      return WorkflowActions.find({$and: [{who:"costumer"}, {statecod:contract.state}]});
    }
    else if(Meteor.userId() == contract.provider) {
      return WorkflowActions.find({$and: [{who:"provider"}, {statecod:contract.state}]});
    }
  };

  /*
    The contractAction event handles the transition of contracts from one state to another.
    The actions can be as follows:
      a_contract_send: Send the contract to the costumer.
      a_sign_contract: Sign the contract.
      a_reject_signature: Reject a contract signature.
      a_reject_contract: Reject a contract.
      a_register_contract: Register a contract in the database.
  */
  Template.contracts.events({
    'click .contractAction': function(evt) {
      evt.target.disabled = true;
      evt.target.hidden = true;
      var _values = evt.target.value.split("|");
      var state = _values[1];
      var _id = _values[0];

      switch(state) {
        case 'a_contract_send':
          var cid = _id;
          getUserPrivateKey().then(function(_pk) {
          var contract = Contracts.findOne({_id: cid});
          signDocument(_pk, contract.contdoc).then(function(signedDoc) {
            var buffer = new Uint8Array(signedDoc);
            //Signatures.insert({userId: Meteor.userId(), docId: contract._id, signature: JSON.stringify(buffer)});
            Contracts.update({_id: cid}, {$set : {providerSignature: btoa(buffer)}});
            });
          });
          Meteor.call('MoveContract', cid, 'a_contract_send');
          break;
        case 'a_sign_contract':
          var cid = _id;
          getUserPrivateKey().then(function(_pk) {
            var contract = Contracts.findOne({_id: cid});
            signDocument(_pk, contract.contdoc).then(function(signedDoc) {
              var buffer = new Uint8Array(signedDoc);
              //Signatures.insert({userId: Meteor.userId(), docId: contract._id, signature: JSON.stringify(buffer)});
              Contracts.update({_id: cid}, {$set: {costumerSignature: btoa(buffer)}});
            });
          });
          Meteor.call('MoveContract', cid, 'a_sign_contract');
          break;
        case 'a_reject_signature':
          var pid = _id;
          Meteor.call('MoveContract', pid, 'a_reject_signature');
        case 'a_reject_contract':
          var pid = _id;
          Meteor.call('MoveContract', pid, 'a_reject_contract');
          break;
        case 'a_register_contract':
          var pid = _id;
          Meteor.call('MoveContract', pid, 'a_register_contract');
          break;
      }
    },
    'click .verProviderSign': function(evt) {
          evt.target.disabled = true;
          //evt.target.hidden = true;
          var cid = evt.target.value;
          var contract = Contracts.findOne({_id: cid});
          var signature = new Uint8Array(JSON.parse("[" + atob(contract.providerSignature) + "]"));
          getUserPublicKey(contract.provider).then(function(upubk) {
            verifyDocumentSignature(upubk, signature, contract.contdoc).then(function(isvalid) {
              if(isvalid) {
                alert("valid signature");
              }
              else {
                alert("not valid signature");
              }
            });
          });
      },
      'click .verCostumerSign': function(evt) {
          evt.target.disabled = true;
          //evt.target.hidden = true;
          var cid = evt.target.value;
          var contract = Contracts.findOne({_id: cid});
          var signature = new Uint8Array(JSON.parse("[" + atob(contract.costumerSignature) + "]"));
          getUserPublicKey(contract.costumer).then(function(upubk) {
            verifyDocumentSignature(upubk, signature, contract.contdoc).then(function(isvalid) {
              if(isvalid) {
                alert("valid signature");
              }
              else {
                alert("not valid signature");
              }
            });
          });
      },
      'click .scoreButton': function(evt) {
        evt.target.hidden = true;
        var cid = evt.target.value;
        //var score = document.getElementsByName("score_"+cid)[0];
        var score = document.getElementById("score_"+cid);
        Scores.insert({userId: Meteor.userId(), contractId: cid, score: score.value, createdBy: Meteor.userId(), createdAt: + new Date()});
      }
  });

  //Get the list of agreements an user has been enrolled.
  Template.history.events({
    'click #find_as_history': function(evt) {
      var as_value = document.getElementById("as_history_user_iput");
      Session.set("as_lookup", as_value.value);
    }
  });

  //Get a list of scores from contracts an user has been enrolled.
  Template.feedbakHistory.feedback = function() {
    var as = Session.get("as_lookup");

    if(as != undefined) {
      var scores = Scores.find({userId: as}).fetch();
      var history = [];

      _.each(scores, function(s) {
        var contract = Contracts.findOne({_id: s.contractId});
        var costumer = Meteor.users.findOne({_id: contract.costumer});
        var provider = Meteor.users.findOne({_id: contract.provider});

        var feedback = {cid: contract._id, costumer: costumer.username, provider: provider.username,
                        score: s.score};

        history.push(feedback);
      });
      return history;
    }
  };

}

function str2ab(s) {
  var str = new String(s);
  var bytes = new Uint8Array(str.length);
  for(var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function ab2str(ab) {
  return String.fromCharCode.apply(null, ab);
}


//Generate public/private key pair
function genUserKeyPair() {
  var userKeys = null

  return window.crypto.subtle.generateKey(
  {
    name: "ECDSA",
    namedCurve: "P-256"
  },
  true,
  ["sign", "verify"]
  ).then(function(key)
  {
    return key;
  });
}

//Sign the document digitally.
function signDocument(_pk, data) {
  return getUserPrivateKey().then(function(_pk) {
    return window.crypto.subtle.sign({name:"ECDSA", hash: {name: "SHA-256"}}, _pk, str2ab(data));
  })
}

//Given a document, verify its signature.
function verifyDocumentSignature(_pubk, signature, data) {
  var _data = str2ab(data);
  return window.crypto.subtle.verify({name:"ECDSA", hash: {name: "SHA-256"}}, _pubk, signature, _data);
}

//Given an user ID get its public key.
function getUserPublicKey(uid) {
    var userPubK = ASInfo.findOne({userId: uid});
    return window.crypto.subtle.importKey("jwk", JSON.parse(userPubK.pubk),
      { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
}

//Get the user private key for the current user.
function getUserPrivateKey() {
  var userPK = ASPrivateInfo.findOne({userId: Meteor.userId()});
  return window.crypto.subtle.importKey("jwk", JSON.parse(userPK.pk),
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
}

//Create a principle shared with two users
function createSharedPrincipal(user1, user2, type, cb) {
  //Principal.create("as","as_" + Meteor.user().username + "_offers", Principal.user(), ferr);

  Principal.create(type, user1 +"_"+ user2 +"_"+ type, Principal.user(), ferr);

  try{

    Principal.lookup([new PrincAttr(type, user1 +"_"+ user2 +"_"+ type)],
                      Meteor.user().username,
                      function(sharedPrincipal) {
                        Principal.lookupUser(user2,
                          function(userPrincipal) {
                            Principal.add_access(userPrincipal, sharedPrincipal,
                              function() {
                                console.log("Access granted");
                                cb();
                              })
                          })
                      });
  }
  catch(err) {
    console.log(err);
  }
}

//Check if a principle shared between two users already exist.
function checkSharedPrincipalExists(user1, user2, type) {
  var princ = null;
  try{
    Principal.lookup([new PrincAttr(type, user1 +"_"+ user2 +"_"+ type)], Meteor.user().username,function(userprincipal) {
      princ = userprincipal;
    });
  }
  catch(err) {
    console.log("Principal not found.");
  }
  return princ;
}