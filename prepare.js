var proposalStates = [
  {
    cod: "p_open",
    desc: "Open",
    nextstate : "p_accept"
  },
  {
    cod: "p_open",
    desc: "Open",
    nextstate: "p_reject"
  },
  {
    cod: "p_accept",
    desc: "Accept",
    nextstate: null
  },
  {
    cod: "p_reject",
    desc: "Reject",
    nextstate: null
  }
];

var contractStates = [
  {
    cod: "c_created",
    desc: "Created",
    nextstate: "c_analysis"
  },
  {
    cod: "c_analysis",
    desc: "Analysis by Client",
    nextstate: "c_reject"
  },
  {
    cod: "c_analysis",
    desc: "Analysis by Client",
    nextstate: "c_signed"
  },
  {
    cod: "c_signed",
    state: "Signed",
    nextstate: "c_reject_provider"
  },
  {
    cod: "c_signed",
    state: "Signed",
    nextstate: "c_registered"
  },
  {
    cod: "c_reject",
    state: "Reject",
    nextstate: null
  },
  {
    cod: "c_reject_provider",
    state: "Reject by Provider",
    nextstate: null
  },
  {
    cod: "c_registed",
    state: "Registered",
    nextstate: null
  }
];

var actions = [
  {
    cod: "p_open",
    who: "provider",
    desc: "Accept proposal?"
  },
  {
    cod: "p_open",
    who: "provider",
    desc: "Reject proposal?"
  },
  {
    cod: "c_analysis",
    who: "costumer",
    desc: "Sign contract?"
  },
  {
    cod: "c_analysis",
    who: "costumer",
    desc: "Reject contract?"
  },
  {
    cod: "c_signed",
    who: "provider",
    desc: "Reject signature?"
  },
  {
    cod: "c_signed",
    who: "provider",
    desc: "Register contract"
  }
];

function populateDB() {
  _.each(actions, function(c) {
  WorkflowActions.insert(c);
});

  _.each(contractStates, function(c) {
  ContractStates.insert(c);
});

  _.each(proposalStates, function(p) {
  ProposalStates.insert(p);
});

}