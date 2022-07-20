const globalConstants = {
  LOCALURL: 'http://localhost:5000/',
  STAGEURL: 'http://localhost:5000/',
  PRODURL: '',
  LIVEURL: '',
  STAGINGURL: '',
  EMAIL : '',
  DB_NAME: "demo",
  JWTOKENLOCAL: 'fax42c62-g215-4dc1-ad2d-sa1f32kk1w22',
  JWTOKENSTAGING: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
  JWTOKENDEV:'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
  JWTOKENLIVE: 'asd42e62-g465-4bc1-ae2c-da1f27kk3a20',
  key: {
       privateKey: 'c3f42e68-b461-4bc1-ae2c-da9f27ee3a20',
       tokenExpiry: 1 * 30 * 1000 * 60 * 24 //1 hour
   },
   MONGODB: {
    LOCALHOST: {
     URL: 'mongodb://localhost:27017/demo',

    },
    TEST: {
      URL: 'mongodb://localhost:27017/demo',


    },
    LIVE: {
      URL: 'mongodb://localhost:27017/demo',

    },
    STAGING: {
      URL: 'mongodb://localhost:27017/demo',
    },
  },
};

module.exports = globalConstants;
