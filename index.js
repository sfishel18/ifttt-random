const axios = require("axios");
const { sample } = require("lodash");

const stringify = input =>
  typeof input === "string" ? input : JSON.stringify(input);

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.index = (req, res) => {
  if (req.method === "HEAD") {
    res.status(200).send();
    return;
  }
  const { auth, webhooks } = req.body;
  if (auth !== process.env.AUTH_KEY) {
    res.status(401).send("Access denied");
    return;
  }
  if (!webhooks || webhooks.length < 1) {
    res.status(400).send('Required argument "webhooks" is missing or empty');
    return;
  }
  const randomWebhook = sample(webhooks);
  axios.get(randomWebhook).then(
    response => res.status(200).send(stringify(response.data))
  )
  .catch(error => {
    console.error(error)
    res.status(400).send('Error triggering webhook')
  });
};
