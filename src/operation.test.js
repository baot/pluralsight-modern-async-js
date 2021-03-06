suite.only("operation test");

function callDone(done) {
  let counter = 0;

  return {
    afterNCalls: function (expectedCount) {
      return function multiDone() {
        counter++;
        if (counter >= expectedCount) {
          // if we go over the count, we'll call done multiple times thus failing the test
          done();
        }
      }
    },
    afterTwoCalls: function () {
      return this.afterNCalls(2);
    }
  }
}

function doLater(func) {
  setTimeout(func, 2);
}

test("fetchCurrentCity pass the callbacks later on", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  // register callbacks
  operation.onCompletion(
    result => done(),
    error => done(error)
  );
});

test("pass multiple callbacks - all of them are called", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  const multiDone = callDone(done).afterTwoCalls();

  // register callbacks
  operation.onCompletion(result => multiDone());
  operation.onCompletion(result => multiDone());

});

test("noop if no success handler passed", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  // noop should register for success handler
  operation.onFailure(err => done(err));

  // trigger success to make sure noop registered
  operation.onCompletion(result => done());

});

test("noop if no error handler passed", (done) => {
  // initiate operation
  const operation = fetchWeather();

  // noop should register for error handler
  operation.onCompletion(result => done(new Error('shouldnt succeed')));

  // trigger failure to make sure noop registered
  operation.onFailure(err => done());

});

test("register success callback async", (done) => {
  const currentCity = fetchCurrentCity();

  doLater(() => {
    currentCity.onCompletion(() => done());
  });
});

test("register error callback async", (done) => {
  const operationWillErrors = fetchWeather();

  doLater(() => {
    operationWillErrors.onFailure(() => done());
  });
});

test("lexical parallelisms", (done) => {
  const city = "NYC";

  let weatherData, forecastData;

  const weatherOp = fetchWeather(city);
  const forecastOp = fetchForecast(city);

  weatherOp.onCompletion((weather) => {
    forecastOp.onCompletion((forecast) => {
      console.log("both done!", `${weather.temp} and ${forecast.fiveDay}`);
      done();
    });
  });
});

test("life is full of async, nesting is inevitable, do sth about it", (done) => {
  fetchCurrentCity()
    .onCompletion(city => fetchWeather(city))
    .onCompletion(weather => done());
});

function fetchCurrentCityThatFails() {
  const operation = Operation();
  doLater(() => operation.fail(new Error("GPS broken")));
  return operation;
}

test("sync error recovery", (done) => {
  fetchCurrentCityThatFails()
    .catch((err) => {
      console.log(err);
      return "default city";
    })
    .then((city) => {
      expect(city).toBe("default city");
      done();
    });
});

test("async error recovery", (done) => {
  fetchCurrentCityThatFails()
    .catch((err) => {
      console.log(err);
      return fetchCurrentCity();
    })
    .then((city) => {
      expect(city).toBe("New York, NY");
      done();
    });
  });

test("error recovery bypassed if not needed", (done) => {
  fetchCurrentCity()
    .catch((err) => {
      console.log(err);
      return "default city";
    })
    .then((city) => {
      expect(city).toBe("New York, NY");
      done();
    });
});


test("error fallthrough", (done) => {
  fetchCurrentCityThatFails()
    .then((city) => {
      console.log(city);
    })
    .catch((err) => {
      expect(err).toEqual(new Error("GPS broken"));
      done();
    });
});

test("synchronous result transformation", (done) => {
  fetchCurrentCity()
    .then((city) => {
      return city;
    })
    .then((city) => {
      console.log(city);
      expect(city).toBe("New York, NY");
      done();
    });
});

test("thrown error recovery", (done) => {
  fetchCurrentCity()
    .then((city) => {
      throw new Error("oops");
      return fetchWeather(city);
    })
    .catch(e => done());
});

test("error after error recovery", (done) => {
  fetchCurrentCity()
    .then((city) => {
      throw new Error("oops");
      return fetchWeather(city);
    })
    .catch((e) => {
      expect(e.message).toBe("oops");
      throw new Error("oops2");
    })
    .catch((e) => {
      expect(e.message).toBe("oops2");
      done();
    });
});

function fetchCurrentCityIndecisive() {
  const operation = Operation();

  doLater(() => {
    operation.resolve("NYC");
    operation.resolve("SG");
  });

  return operation;
}

test("protect from doubling up on success", (done) => {
  fetchCurrentCityIndecisive()
    .then(result => done());
});

function fetchCurrentCityRepeatedFailures() {
  const operation = Operation();

  doLater(() => {
    operation.fail(new Error("fail1"));
    operation.fail(new Error("fail2"));
  });

  return operation;
}

test("protect from doubling up on failure", (done) => {
  fetchCurrentCityRepeatedFailures()
    .catch(e => done());
});

function fetchCurrentCity2() {
  const operation = new Operation();
  console.log("getting started");
  operation.resolve("NY");
  return operation;
}

test("always async", (done) => {
  let ui;

  fetchCurrentCity2()
    .then((city) => {
      ui = city;
    });

  ui = "loading";

  setTimeout(() => {
    expect(ui).toBe("NY");
    done();
  }, 1000);
});

test("what is resolve?", (done) => {
  const fetchCurrentCity3 = new Operation();
  fetchCurrentCity3.resolve("NYC");

  const fetchClone = new Operation();
  fetchClone.resolve(fetchCurrentCity3);

  fetchClone.then((city) => {
    expect(city).toBe("NYC");
    done();
  })
});
