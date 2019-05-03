const { ActivityTypes, TurnContext } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, ChoicePrompt } = require('botbuilder-dialogs');
const { FlightDialog } = require('./dialogs/flights');
const { hotelsDialog } = require('./dialogs/hotels');
const { BASE_DIALOG, 
    INITIAL_PROMPT,
    HOTELS_DIALOG,
    INITIAL_HOTEL_PROMPT,
    FLIGHTS_DIALOG,
    SUPPORT_DIALOG
} = require('./const');

// Define identifiers for our state property accessors.
const CONVERSATION_STATE_ACCESSOR = 'conversationStateAccessor';

class MyBot {
    constructor(conversationState) {
	    // Create the state property accessor and save the state
        this.conversationStateAccessor = conversationState.createProperty(CONVERSATION_STATE_ACCESSOR);
        this.conversationState = conversationState;

        // Create a dialog set for the bot. It requires a DialogState accessor, with which
        // to retrieve the dialog state from the turn context.
        this.dialogSet = new DialogSet(this.conversationStateAccessor);
        this.dialogSet.add(new ChoicePrompt(INITIAL_PROMPT, this.validateNumberOfAttempts.bind(this)));
        this.dialogSet.add(new TextPrompt(INITIAL_HOTEL_PROMPT));
        this.dialogSet.add(new FlightDialog(FLIGHTS_DIALOG));

        // Define the steps of the base waterfall dialog and add it to the set.
        this.dialogSet.add(new WaterfallDialog(BASE_DIALOG, [
            this.promptForBaseChoice.bind(this),
            this.respondToBaseChoice.bind(this),
        ]));

        // Define the steps of the hotels waterfall dialog and add it to the set.
        this.dialogSet.add(new WaterfallDialog(HOTELS_DIALOG, hotelsDialog));
    }
    
    /**
     *
     * @param {TurnContext} turnContext turn context object.
     */
    async onTurn(turnContext) {
        const conversationData = await this.conversationStateAccessor.get(turnContext, { attempts: 0 });
        turnContext.turnState.set('conversationData', conversationData);
        switch (turnContext.activity.type) {
            case ActivityTypes.Message:
                // Generate a dialog context for our dialog set.
                const dialogContext = await this.dialogSet.createContext(turnContext);
                if (!dialogContext.activeDialog) {
                    await dialogContext.beginDialog(BASE_DIALOG);
                }else {
                    await dialogContext.continueDialog();
                }
                break;
            case ActivityTypes.EndOfConversation:
            case ActivityTypes.DeleteUserData:
                break;
            default:
                break;
        }
        this.conversationState.saveChanges(turnContext);
    }

    async promptForBaseChoice(stepContext) {
        return await stepContext.prompt(
            INITIAL_PROMPT, {
                prompt: 'Are you looking for a flight or a hotel?',
                choices: ['Hotel', 'Flight'],
                retryPrompt: 'Not a valid option'
            }
        );
    }

    async respondToBaseChoice(stepContext) {
        // Retrieve the user input.
        const answer = stepContext.result.value;
        if (!answer) {
            // exhausted attemps and no selection, start over
            await stepContext.context.sendActivity('Not a valid option. We\'ll restart the dialog so you can try again!');
            return await stepContext.endDialog();
        }
        if(answer === 'Hotel') {
            return await stepContext.beginDialog(HOTELS_DIALOG);
        }
        if(answer === 'Flight') {
            return await stepContext.beginDialog(FLIGHTS_DIALOG);
        }
        await stepContext.context.sendActivity('ok, got it');
        return await stepContext.endDialog();
    }

    async validateNumberOfAttempts(promptContext) {
        const localConversationData = promptContext.context.turnState.get('conversationData');
        localConversationData.attempts++;
        await this.conversationStateAccessor.set(promptContext.context, localConversationData);
        await this.conversationState.saveChanges(promptContext.context);

        if (localConversationData.attempts > 3) {
            // cancel everything
            await promptContext.context.sendActivity('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return await promptContext.context.endDialog();
        }

        if(!promptContext.recognized.succeeded) {
          await promptContext.context.sendActivity(promptContext.options.retryPrompt);
          return false;
        }
        return true;
    }
}

module.exports.MyBot = MyBot;
