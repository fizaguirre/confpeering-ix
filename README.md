# CONFPEERING-IX

CONFPEERING-IX is a plataform prototype that aims to improve the agreement process to exchange traffic between ASes in an IXP environment.
This prototype was developed using Mylar (https://css.csail.mit.edu/mylar/), a web framework to store and share registers in a database in a confidetial way.

## Full thesis

[CONFPEERING-IX](https://lume.ufrgs.br/handle/10183/193315)
___

# Setup

CONFPEERING-IX is build on top of Mylar that in the version available at this time require some libraries that are most presented on Debian 7. All the instructions in this page is oriented to be used in this operational system.

1. Download and follow the instructions on how to setup Mylar at https://css.csail.mit.edu/mylar/. For simplicity the path Mylar is installed is going to be referenced as <metor_folder>.
1.1. _Tip: If you are using Debian 7 as recomended here, install the following packages to run meteor: build-essential, curl, flex, bison, libgmp-dev, libntl-dev, zlib1g-dev, libreadline-dev, libssl-dev.
Download and compile [libpbc](https://crypto.stanford.edu/pbc/)._
2. Clone the CONPEERING-IX project on github.
3. To run the application, on the CONFPEERING-IX project folder, run:
```shell
<meteor_folder>/meteor
```
4. To reset the database, run:
```shell
<meteor_folder>/meteor reset
```

## Aditional notes about the setup

# Project structure
The project has two components. The CONPEERING-IX application that runs in top of Mylar and a Web Server acting as a proxy server for HTTPS termination. The Web Server stands in front of the CONFPEERING-IX application and handle the HTTPS encryption between client and server.

Client <-> Apache 2.2.22 <-> CONFPEERING-IX

# Folder structure

* project_folder: This folder keeps the _env.sh_, _models.js_ and _prepare.js_ files. Also the client and server folders.
The env.sh file set some environment variables useful for the operation of the plataform. The _model.js_ file defines how the data is organized in the database. The _prepare.js_ file fills the database with data used by the application logic.
* server: This folder keeps the files that are going to be running in the server side. The server is responsible to control the access and procedures of the application.
* client: This folder keeps the files that are going to be running in the client side. The client is the interface used by the user to access the platform and perform his operations.

# Bind to another interface

By default the Mylar platform is configured to bind its crypto components only in the localhost interface. If you want to bind the protocol in a different interface, follow  the instructions below.
1. Go to the folder <meteor_folder>/packages/search and edit the file _crypto_server.js_.
2. In the _crypto_server.js_ file edit the value of the variable *base_url* to the IP address of the interface you want the crypto server to br binded to.

# Apache 2.2.22

The project needs a web server as frontend that can handle the HTTPS protocol, to encrypt the communucation between cliend and server. Also to make use of some cryptogric functions presented in most ot the modern web browsers, HTTPS is a requirement.
In the folder _apache_ you can find some template files to configure the Apache 2.2.22 Web Server to act as a proxy server to the CONPEERING-IX.