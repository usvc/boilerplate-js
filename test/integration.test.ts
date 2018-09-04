import * as supertest from 'supertest';
import {match, stub} from 'sinon';
import * as chai from 'chai';
import {withDefaults, withFetch} from './helper/boilerplate';
import {testBody, testUrlEncodedBody} from './helper/data';

chai.use(require('sinon-chai'));

const {expect} = chai;

describe('@usvc/boilerplate', () => {
  context('with fetch request module', () => {
    let app;
    let request;
    let instance;

    before((done) => {
      app = withFetch.app;
      request = withFetch.request;
      instance = app.listen();
      instance.on('listening', done);
    });

    after(() => {
      instance.close();
    });

    it('works as expected', () => {
      request(`http://localhost:${instance.address().port}/healthz`, {
        remoteServiceName: 'a',
      }).then((response) => response.json())
        .then((response) => {
          expect(response.truthy.status).to.eql(true);
        });
    });
  });

  context('with defaults',() => {
    context('.server', () => {
      let app;
      let logger;

      before(() => {
        app = withDefaults.app;
        logger = withDefaults.logger;
        stub(logger, 'http');
      });

      after(() => {
        logger.http.restore();
      });

      afterEach(() => {
        logger.http.resetHistory();
      });

      context('access logging', () => {
        beforeEach(() => {
          return supertest(app).get('/');
        });

        it('has the correct schema', () => {
          expect(logger.http).to.be.calledWithMatch(
            'access',
            match((accessObject) => {
              expect(accessObject).to.have.keys([
                'message',
                'contentLength',
                'context',
                'httpVersion',
                'level',
                'method',
                'remoteAddress',
                'remoteHostname',
                'responseTimeMs',
                'serverHostname',
                'status',
                'time',
                'url',
                'userAgent',
              ]);
              expect(accessObject.context).to.have.keys([
                'parentId',
                'sampled',
                'spanId',
                'traceId',
              ]);
              return true;
            })
          );
        });

        it('logs with message "access"', () => {
          expect(logger.http).to.be.calledWithMatch(
            'access',
            match((accessObject) => {
              expect(accessObject.message).to.deep.equal('access');
              return true;
            })
          );
        });

        it('logs with level "access"', () => {
          expect(logger.http).to.be.calledWithMatch(
            'access',
            match((accessObject) => {
              expect(accessObject.level).to.deep.equal('access');
              return true;
            })
          );
        });

        it('logs with a valid context', () => {
          expect(logger.http).to.be.calledWithMatch(
            'access',
            match((accessObject) => {
              expect(accessObject.context.parentId)
                .to.deep.equal(accessObject.context.spanId);
              expect(accessObject.context.parentId)
                .to.not.equal(accessObject.context.traceId);
              return true;
            })
          );
        });
      });
      // context: access logging

      context('health check', () => {
        let results;

        before(() => {
          results = supertest(app).get('/healthz');
          return results;
        });

        it('works', () => {
          expect(results.response.status).to.deep.equal(200);
        });
      });
      // context: health check

      context('readinesss check', () => {
        let results;
      
        before(() => {
          results = supertest(app).get('/readyz');
          return results;
        });

        it('works', () => {
          expect(results.response.status).to.deep.equal(500);
        });
      });
      // context: readiness check

      context('metrics', () => {
        let results;
      
        before(() => {
          results = supertest(app).get('/metrics');
          return results;
        });
        
        it('works', () => {
          expect(results.response.status).to.deep.equal(200);
          const {text} = results.response;
          expect(text).to.contain('process_cpu_user_seconds_total');
          expect(text).to.contain('process_cpu_system_seconds_total');
          expect(text).to.contain('process_cpu_seconds_total');
          expect(text).to.contain('process_start_time_seconds');
          expect(text).to.contain('process_resident_memory_bytes');
          expect(text).to.contain('process_virtual_memory_bytes');
          expect(text).to.contain('process_heap_bytes');
          expect(text).to.contain('process_open_fds');
          expect(text).to.contain('process_max_fds');
          expect(text).to.contain('nodejs_eventloop_lag_seconds');
          expect(text).to.contain('nodejs_active_handles_total');
          expect(text).to.contain('nodejs_active_requests_total');
          expect(text).to.contain('nodejs_heap_size_total_bytes');
          expect(text).to.contain('nodejs_heap_size_used_bytes');
          expect(text).to.contain('nodejs_external_memory_bytes');
          expect(text).to.contain('nodejs_heap_space_size_total_bytes');
          expect(text).to.contain('nodejs_heap_space_size_used_bytes');
          expect(text).to.contain('nodejs_heap_space_size_available_bytes');
          expect(text).to.contain('nodejs_version_info');
          expect(text).to.contain('up 1');
        });
      });
      // context: metrics

      context('body parsing', () => {
        before(() => {
          app.post('/__body', (req, res) => {
            res.json(req.body);
          });
        });

        describe('json body', () => {
          it('works with "Content-Type: application/json"', () =>
            supertest(app)
              .post('/__body')
              .set('Content-Type', 'application/json')
              .send(testBody)
              .then(({body}) => {
                expect(body).to.deep.equal(testBody);
              })
          );
        });

        describe('url encoded body', () => {
          it('works with "Content-Type: application/x-www-form-urlencoded"',
            () =>
              supertest(app)
                .post('/__body')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(testBody)
                .then(({body}) => {
                  expect(body).to.deep.equal(testUrlEncodedBody);
                })
          );
        });
      });
      // context: json body parsing

      context('compression', () => {
        before(() => {
          app.get('/__no_compression', (_req, res) => {
            res.json((() => {
              let size = 1022;
              let junkData = '';
              while (--size) {
                junkData += Math.floor(Math.random() * 10);
              }
              return junkData;
            })());
          });

          app.get('/__compression', (_req, res) => {
            res.json((() => {
              let size = 1023;
              let junkData = '';
              while (--size) {
                junkData += Math.floor(Math.random() * 10);
              }
              return junkData;
            })());
          });
        });

        it('applied when response size >= 1023 bytes', () =>
          supertest(app)
            .get('/__compression')
            .then((res) => {
              expect(res.headers).to.have.property('content-encoding');
              expect(res.headers['content-encoding']).to.deep.equal('gzip');
            })
        );

        it('not applied when response size <= 1022 bytes', () =>
          supertest(app)
            .get('/__no_compression')
            .then((res) => {
              expect(res.headers).to.not.have.property('content-encoding');
            })
        );
      });
      // context: compression

      context('security', () => {
        context('cors', () => {
          before(() => {
            app.get('/__cors', (req, res) => {
              res.json('ok');
            });
            app.use((err, req, res, next) => {
              if (err) {
                if (err.status) {
                  res.status(err.status);
                }
                if (err.message) {
                  res.json(err.message);
                  return;
                }
              }
              res.json('unknown error');
            });
          });

          after(() => {
            // remove the error handler
            app._router.stack.pop();
          });

          it('prevents unauthorized origins from accessing it', () =>
            supertest(app)
              .get('/__cors')
              .set('Origin', 'http://wrongurl.com')
              .expect(401)
          );

          it('allows authorized origins to access it', () =>
            supertest(app)
              .get('/__cors')
              .set('Origin', 'http://_test.com')
              .expect(200)
          );
        });
        // context: cors

        context('csp', () => {
          it('works', () =>
            supertest(app)
              .get('/')
              .then((res) => {
                console.info(res.headers);
              })
          );
        });
      });
      // context: security
    });
    // context: server
  });
  // context: with defaults
});
