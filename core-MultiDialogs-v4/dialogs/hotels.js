const { INITIAL_HOTEL_PROMPT } = require('../const');

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
    }
];

exports.hotelsDialog = hotelsDialog;