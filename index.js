var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server

const LUIS_KEY = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/2bbf96e7-f6c0-4ae9-ad5b-55923755052d?subscription-key=ca04d674a0e94fe594801a22acee2bb9&timezoneOffset=0&verbose=true&q=";

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// // Create chat bot
// var connector = new builder.ChatConnector({
//     appId: 'ff5d072d-f252-4f1c-9b97-6b4b06b095ed',
//     appPassword: 'dtxkqZUSY816\koWDO43~\)'
// });
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var model = LUIS_KEY;
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({recognizers: [recognizer]});
bot.recognizer(recognizer);

bot.dialog('/', intents);
intents.matches('None', '/none')
    .matches('Send Money', '/sendMoney')
    .matches('Balance', '/getBalance')
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))

//=========================================================
// Bots Dialogs
//=========================================================

var accountBalance = 999;

// bot.dialog('/', function(session){
//     session.send("You sent %s which was %d characters", session.message.text, session.message.text.length);
// })

bot.dialog('/none', function (session) {
    session.send("No intent found");
    session.endDialog();
});

bot.dialog('/getBalance', function (session) {
    session.send("Your balance is %d", accountBalance);
    session.endDialog();
});

var nameGlobal;
var moneyGlobal;

bot.dialog('/sendMoney', [
    function (session, args, next) {
        session.dialogData.profile =  {}; // Set the profile or create the object.
        var name = builder.EntityRecognizer.findEntity(args.entities, 'name');
        var money = builder.EntityRecognizer.findEntity(args.entities, "builtin.currency");
        var count = 0;
        // for(var arg in args.entities){
        //     console.log(arg[count].type);
        //     count++;
        // }
        var profile = session.dialogData.profile = {
            name: name ? name.entity : null,
            money: money ? money.entity : null
        };

        console.log(session.dialogData.profile.name + '1');

        // if (profile.name) {
        //     console.log('Name is not null');
        //     session.dialogData.profile.name = profile.name.entity;
        // }
        // if(profile.money){
        //     console.log('Money is not null');
        //     session.dialogData.profile.money = profile.money.entity;
        // }
        console.log(session.dialogData.profile.name + '2');

        if(session.dialogData.profile.name === null) {
            builder.Prompts.text(session, "Who are you sending too?");
        }else{
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            // Save recievers's name if we asked for it.
            session.dialogData.profile.name = results.response;
        }

        console.log(session.dialogData.profile.name + '3');

        if (session.dialogData.profile.money === null) {
            builder.Prompts.text(session, "How much money do you want to send?");
        } else {
            next(); // Skip if we already have this info.
        }
    },
    function (session, results) {
        if (results.response) {
            // Save company name if we asked for it.
            session.dialogData.profile.money = results.response;
        }
        console.log(session.dialogData.profile.name + '4');
        session.send("Okay I've sent " + session.dialogData.profile.money + " to " + session.dialogData.profile.name);
        session.endDialog();
    }
]);


