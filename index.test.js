/**
 * @jest-environment node
 */

const waitOn = require("wait-on");
const axios = require("axios");
const { once } = require("lodash");
const promiseTools = require("promise-tools");

const { API_URL = "http://localhost:8080" } = process.env;

describe("index function", () => {
  beforeAll(() => waitOn({ resources: [API_URL] }));
  test("access denied if auth is wrong", () => {
    expect.assertions(2);
    return axios
      .post(API_URL, {
        auth: process.env.AUTH_KEY.slice(0, -1)
      })
      .catch(error => {
        expect(error.response.status).toEqual(401);
        expect(error.response.data).toMatchInlineSnapshot(`"Access denied"`);
      });
  });
  test("bad request if webhooks is missing", () => {
    expect.assertions(2);
    return axios
      .post(API_URL, {
        auth: process.env.AUTH_KEY
      })
      .catch(error => {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toMatchInlineSnapshot(
          `"Required argument \\"webhooks\\" is missing or empty"`
        );
      });
  });
  test("bad request if webhooks is empty", () => {
    expect.assertions(2);
    return axios
      .post(API_URL, {
        auth: process.env.AUTH_KEY,
        webhooks: []
      })
      .catch(error => {
        expect(error.response.status).toEqual(400);
        expect(error.response.data).toMatchInlineSnapshot(
          `"Required argument \\"webhooks\\" is missing or empty"`
        );
      });
  });
  test("successfully hits the only webhook if given just one", () => {
    expect.assertions(2);
    return axios
      .post(API_URL, {
        auth: process.env.AUTH_KEY,
        webhooks: ["https://postman-echo.com/response-headers?dog=Salvador"]
      })
      .then(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
          Object {
            "dog": "Salvador",
          }
        `);
      });
  });
  test("successfully hits the only webhook if given just one", () => {
    expect.assertions(2);
    return axios
      .post(API_URL, {
        auth: process.env.AUTH_KEY,
        webhooks: ["https://postman-echo.com/response-headers?dog=Salvador"]
      })
      .then(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
Object {
  "dog": "Salvador",
}
`);
      });
  });
  test(
    "eventually hits all given webhooks if called repeatedly",
    () => {
      const webhooks = [
        "https://postman-echo.com/response-headers?dog=Salvador",
        "https://postman-echo.com/response-headers?baby=Nora",
        "https://postman-echo.com/response-headers?city=Portland",
        "https://postman-echo.com/response-headers?state=Oregon"
      ];
      expect.assertions(2 * webhooks.length);
      let hitWebhooks = 0;

      const assertDog = once(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
Object {
  "dog": "Salvador",
}
`);
        hitWebhooks++;
      });

      const assertBaby = once(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
Object {
  "baby": "Nora",
}
`);
        hitWebhooks++;
      });

      const assertCity = once(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
Object {
  "city": "Portland",
}
`);
        hitWebhooks++;
      });

      const assertState = once(response => {
        expect(response.status).toEqual(200);
        expect(response.data).toMatchInlineSnapshot(`
Object {
  "state": "Oregon",
}
`);
        hitWebhooks++;
      });

      return promiseTools.whilst(
        () => hitWebhooks < webhooks.length,
        () =>
          axios
            .post(API_URL, {
              auth: process.env.AUTH_KEY,
              webhooks
            })
            .then(response => {
              if (response.data.dog) {
                assertDog(response);
              } else if (response.data.baby) {
                assertBaby(response);
              } else if (response.data.city) {
                assertCity(response);
              } else if (response.data.state) {
                assertState(response);
              }
            })
      );
    },
    10 * 60 * 1000
  );
});
