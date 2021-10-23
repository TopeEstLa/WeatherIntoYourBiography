const { USERNAME, PASSWORD, CITY, APPID } = require('./config.json');
const { IgApiClient } = require('instagram-private-api');
const hourToDayOrNight = require('hour-to-day-or-night');
const openWeatherApi = require('openweather-apis');
const cron = require('node-cron');

const instagramClient = new IgApiClient();

instagramClient.state.generateDevice(USERNAME);

function setupOpenWeatherApi() {
    openWeatherApi.setLang('fr');
    openWeatherApi.setCity(CITY);
    openWeatherApi.setUnits('metric');
    openWeatherApi.setAPPID(APPID);
}

async function loginInstagramClient() {
    await instagramClient.simulate.preLoginFlow();
    await instagramClient.account.login(USERNAME, PASSWORD);
    process.nextTick(async () => await instagramClient.simulate.postLoginFlow());
    //await instagramClient.account.setBiography(`It is currently ${new Date().toLocaleString()}`);
}

async function updateBiography(emoji) {
    console.log("Biography updated");
    await instagramClient.account.setBiography(emoji);
}

setupOpenWeatherApi();
loginInstagramClient();

console.log(`Started on ${new Date().toLocaleString()}`);

cron.schedule('*/10 * * * *', async () => {

    if (hourToDayOrNight(parseInt(new Date().getHours().toLocaleString())) === "day") {
        openWeatherApi.getSmartJSON(async (err, smart) => {
            switch (smart.description) {
                case "ciel dégagé":
                    await updateBiography("☀️");
                    break;
                case "peu nuageux":
                    await updateBiography("🌤");
                    break;
                case "partiellement nuageux": case "couvert":
                    await updateBiography("⛅️");
                    break;
                case "nuageux":
                    await updateBiography("☁️");
                    break;
                case "brume sèche": case "brume": case "brouillard":
                    await updateBiography("🌫");
                    break;
                case "légère pluie": case "pluie modérée":
                    await updateBiography("🌧");
                    break;
                default:
                    console.log("Weather unrecognized " + smart.description);
            }
        });
    } else {
        await updateBiography("🌙");
    }

});