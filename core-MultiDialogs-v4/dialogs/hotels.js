const { INITIAL_HOTEL_PROMPT, CHECKIN_TIME_PROMPT } = require('../const');

const hotelsDialog = [
    async (stepContext) => {
        await stepContext.context.sendActivity('Welcome to the Hotels finder!');
        return await stepContext.prompt(
            INITIAL_HOTEL_PROMPT, {
                prompt: 'Please enter your destination'
            }
        );
    },
    async (stepContext) => {
        const destination = stepContext.result;
        await stepContext.context.sendActivity(`Looking for hotels in ${destination}`);
        return stepContext.next();
    },
    async (stepContext) => {
        try {
        return await stepContext.prompt(
            CHECKIN_TIME_PROMPT, {
                prompt: 'When do you want to check in?'
            }
        );
    }catch(err) {
        console.log(err);
    }
    },
    async (stepContext) => {
        const checkinTime = stepContext.result;
        await stepContext.context.sendActivity(`You said ${checkinTime}`);
        const x = 9;
    },
];

exports.hotelsDialog = hotelsDialog;