function ferr(e)
{
  console.log(e);
}

function generateHash() {
  return Math.random().toString(36).substring(7);
}

var searchKey = '';

if (Meteor.isClient) {

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

      userKeys = null;
      genUserKeyPair().then(function(k) { userKeys = k;});

      Accounts.createUser(registerUser, function(error){
        if(Meteor.user())
        {
          console.log(Meteor.user());
          Principal.create("as","as_" + Meteor.user().username + "_offers", Principal.user(), ferr);

          genUserKeyPair().then(function(k) {

            window.crypto.subtle.exportKey("jwk", k.privateKey).then(
              function(_pk) {
                ASPrivateInfo.insert({userId: Meteor.userId(), pk: JSON.stringify(_pk)});
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
      _bwidth = evt.target.bwidth.value;
      _latency = evt.target.latency.value;
      _pkt_loss = evt.target.pkt_loss.value;
      _jitter = evt.target.jitter.value;
      _repair = evt.target.repair.value;
      _guarantee = evt.target.guarantee.value;
      _availability = evt.target.availability.value;
      _billing = evt.target.billing.value;
      _ingress = evt.target.ingress.value;
      _egress = evt.target.egress.value;
      _lengh = evt.target.lengh.value;
      
      _signature = null;

      _userId = Meteor.userId();
      _createdAt = '';

      //Meteor.call('getServerTime', function(e, r) { _createdAt = r; });

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

                          var _offerId = Offers.insert(_offer);

                          getUserPrivateKey().then(function(_pk) {
                            signDocument(_pk,JSON.stringify(_offer)).then(function(signedDoc) {
                              buffer = new Uint8Array(signedDoc);
                              Signatures.insert({userId: Meteor.userId(), docId:_offerId, signature: JSON.stringify(buffer)});
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

  Template.shareOffers.events({
    'submit form': function(evt) {
      evt.preventDefault();

      partnerUserId = Meteor.users.findOne({username: evt.target.as_share.value});

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

  Template.searchOffersResult.offersResult = function() {
    var search_tag = Session.get("search_tag");
    if(search_tag) {    
        return Offers.find({_tag : search_tag});
    }
    return Offers.find({_tag: "nothing"});
  }

  Template.searchOffers.events({
    'submit form': function(evt) {
      evt.preventDefault();
      var searchField = evt.target.aspath3.value;
      Offers.search("search-offers", {aspath: searchField}, Principal.user(), Meteor.userId(), displayResults);
      console.log("Searching "+ searchField);
    }
  });

  Template.searchOffersResult.events({
    'click .sendProposal': function(evt) {
      evt.preventDefault();

      proposalDoc = generateHash();

      offer = Offers.findOne({_id: evt.target.value});
      Proposals.insert({costumer: Meteor.userId(), provider: offer.createdBy, offer_id: offer._id,
                        propdoc: proposalDoc, state: "p_open"});

    }
  });

  Template.offer.offers = function() {
    return Offers.find({createdBy:Meteor.userId()});
    //return Offers.find();
  };

  Template.proposals.proposal = function() {
    //return Proposals.find({$or: [{costumer : Meteor.userId()}, {provider : Meteor.userId()}]});
    return Proposals.find();
    //return Offers.find();
  };

  Template.proposals.actions = function(pid) {
    proposal = Proposals.findOne({_id:pid});
    
    if(Meteor.userId() == proposal.costumer) {
      return WorkflowActions.find({$and: [{who:"costumer"}, {statecod:proposal.state}]});
    }
    else if(Meteor.userId() == proposal.provider) {
      return WorkflowActions.find({$and: [{who:"provider"}, {statecod:proposal.state}]});
    }
  };

  Template.proposals.states = function(state_cod) {
    return ProposalStates.findOne({cod:state_cod});
  };

  Template.proposals.events({
    'click .proposalAction': function(evt) {
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
          pid = _id;
          Meteor.call('MoveProposal', pid, 'a_gen_contract', generateHash());
          break;
      }
    }
  });

  Template.contracts.contract = function() {
    //return Proposals.find({$or: [{costumer : Meteor.userId()}, {provider : Meteor.userId()}]});
    return Contracts.find();
    //return Offers.find();
  };

  Template.contracts.states = function(state_cod) {
    return ContractStates.findOne({cod:state_cod});
  };

  Template.contracts.actions = function(pid) {
    contract = Contracts.findOne({_id:pid});
    
    if(Meteor.userId() == contract.costumer) {
      return WorkflowActions.find({$and: [{who:"costumer"}, {statecod:contract.state}]});
    }
    else if(Meteor.userId() == contract.provider) {
      return WorkflowActions.find({$and: [{who:"provider"}, {statecod:contract.state}]});
    }
  };

  Template.contracts.events({
    'click .contractAction': function(evt) {
      var _values = evt.target.value.split("|");
      var state = _values[1];
      var _id = _values[0];

      switch(state) {
        case 'a_contract_send':
          cid = _id;
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
          cid = _id;
          getUserPrivateKey().then(function(_pk) {
            var contract = Contracts.findOne({_id: cid});
            signDocument(_pk, contract.contdoc).then(function(signedDoc) {
              var buffer = new Uint8Array(signedDoc);
              //Signatures.insert({userId: Meteor.userId(), docId: contract._id, signature: JSON.stringify(buffer)});
              Contracts.update({_id: cid}, {$set: {costumerSignature: JSON.stringify(buffer)}});
            });
          });
          Meteor.call('MoveContract', cid, 'a_sign_contract');
          break;
        case 'a_reject_signature':
          pid = _id;
          Meteor.call('MoveContract', pid, 'a_reject_signature');
        case 'a_reject_contract':
          pid = _id;
          Meteor.call('MoveContract', pid, 'a_reject_contract');
          break;
        case 'a_register_contract':
          pid = _id;
          Meteor.call('MoveContract', pid, 'a_register_contract');
          break;
      }
    },
    'click .verProviderSign': function(evt) {
          cid = evt.target.value;
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
          cid = evt.target.value;
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
      }
  });
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

function genUserKeyPair() {
  userKeys = null

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

function signDocument(_pk, data) {
  return getUserPrivateKey().then(function(_pk) {
    return window.crypto.subtle.sign({name:"ECDSA", hash: {name: "SHA-256"}}, _pk, str2ab(data));
  })
}

function verifyDocumentSignature(_pubk, signature, data) {
  _data = str2ab(data);
  return window.crypto.subtle.verify({name:"ECDSA", hash: {name: "SHA-256"}}, _pubk, signature, _data);
}

function getUserPublicKey(uid) {
    var userPubK = ASInfo.findOne({userId: uid});
    return window.crypto.subtle.importKey("jwk", JSON.parse(userPubK.pubk),
      { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
}

function getUserPrivateKey() {
  var userPK = ASPrivateInfo.findOne({userId: Meteor.userId()});
  return window.crypto.subtle.importKey("jwk", JSON.parse(userPK.pk),
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
}