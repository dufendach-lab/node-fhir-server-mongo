/*eslint no-unused-vars: "warn"*/

const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
const FHIRServer = require('@asymmetrik/node-fhir-server-core');
const { ObjectID } = require('mongodb');
const logger = require('@asymmetrik/node-fhir-server-core').loggers.get();

const { COLLECTION, CLIENT_DB } = require('../../constants');
const moment = require('moment-timezone');
const globals = require('../../globals');
const jsonpatch = require('fast-json-patch');

const { getUuid } = require('../../utils/uid.util');

const {
  stringQueryBuilder,
  tokenQueryBuilder,
  referenceQueryBuilder,
  addressQueryBuilder,
  nameQueryBuilder,
  dateQueryBuilder,
} = require('../../utils/querybuilder.util');

let getProcedure = (base_version) => {
  return resolveSchema(base_version, 'Procedure');
};

let getMeta = (base_version) => {
  return resolveSchema(base_version, 'Meta');
};

let buildStu3SearchQuery = (args) => {
    // Common search params
    let { _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

    // Search Result params
    let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
    args;

    // Resource Specific params
    let based_on = args['based-on'];
    let category = args['category'];
    let code = args['code'];
    let _context = args['_context'];
    let date = args['date'];
    let definition = args['definition'];
    let encounter = args['encounter'];
    let identifier = args['identifier'];
    let location = args['location'];
    let part_of = args['part-of'];
    let patient = args['patient'];
    let performer = args['performer'];
    let status = args['status'];
    let subject = args['subject'];

    let query = {};
    let ors = [];

    if (_id) {
      query.id = _id;
    }

    if (based_on) {
      let queryBuilder = referenceQueryBuilder(based_on, 'basedOn.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (part_of) {
      let queryBuilder = referenceQueryBuilder(part_of, 'partOf.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (subject) {
      let queryBuilder = referenceQueryBuilder(subject, 'subject.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (encounter) {
      let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (location) {
      let queryBuilder = referenceQueryBuilder(location, 'location.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    return query;
  };

  let buildStu2SearchQuery = (args) => {
    // Common search params
    let { _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

    // Search Result params
    let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
    args;

    // Resource Specific params
    let based_on = args['based-on'];
    let category = args['category'];
    let code = args['code'];
    let _context = args['_context'];
    let date = args['date'];
    let definition = args['definition'];
    let encounter = args['encounter'];
    let identifier = args['identifier'];
    let location = args['location'];
    let part_of = args['part-of'];
    let patient = args['patient'];
    let performer = args['performer'];
    let status = args['status'];
    let subject = args['subject'];

    let query = {};
    let ors = [];

    if (_id) {
      query.id = _id;
    }

    if (based_on) {
      let queryBuilder = referenceQueryBuilder(based_on, 'basedOn.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (part_of) {
      let queryBuilder = referenceQueryBuilder(part_of, 'partOf.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }
    
    if (subject) {
      let queryBuilder = referenceQueryBuilder(subject, 'subject.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (encounter) {
      let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (location) {
      let queryBuilder = referenceQueryBuilder(location, 'location.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    return query;
  };

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */
module.exports.search = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> search');

    // TODO: Build query from Parameters
    let { base_version } = args;
    let query = {};

    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }

    // TODO: Query database
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    let Procedure = getProcedure(base_version);

    // Cast all results to Procedure Class
    collection.find(query).toArray().then(
      (procedures) => {
        procedures.forEach(function (element, i, returnArray) {
          returnArray[i] = new Procedure(element);
        });
    
        // TODO: Set data with constructor or setter methods

        // Return Array
        resolve(procedures);
      },
      err => {
        logger.error('Error with Procedure.search: ', err);
        return reject(err);
      }
    )
  });

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> searchById');

    let { base_version, id } = args;

    let Procedure = getProcedure(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, procedure) => {
      if (err) {
        logger.error('Error with Procedure.searchById: ', err);
        return reject(err);
      }

      // Cast result to Procedure Class

      // TODO: Set data with constructor or setter methods

      // Return resource class
      // resolve(procedure_resource);
      if (procedure) {
        resolve(new Procedure(procedure));
      }
      resolve();
    });
  });

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> create');

    let resource = req.body;

    let { base_version } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    // Make sure to use this ID when inserting this resource

    let Procedure = getProcedure(base_version);
    let procedure = new Procedure(resource);


    // TODO: determine if client/server sets ID
    let id = getUuid(procedure);

    // Cast resource to Procedure Class

    // TODO: set meta info
    let Meta = getMeta(base_version);

    procedure.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });

    // TODO: save record to database
    let doc = JSON.parse(JSON.stringify(procedure.toJSON()));
    Object.assign(doc, { id: id });

    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with Procedure.create: ', err);
        return reject(err);
      }

      let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);

      // Return Id
      return history_collection.insertOne(history_doc, (err2) => {
        if (err2) {
          logger.error('Error with ProcedureHistory.create: ', err2);
          return reject(err2);
        }
        return resolve({ id: doc.id, resource_version: doc.meta.versionId });
      });
    });
  });

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Procedure.searchById: ', err);
        return reject(err);
      }

      let Procedure = getProcedure(base_version);
      let procedure = new Procedure(resource);
      if (data && data.meta) {
        let foundProcedure = new Procedure(data);
        let meta = foundProcedure.meta;
        meta.versionId = `${parseInt(foundProcedure.meta.versionId) + 1}`;
        procedure.meta = meta;
      } else {
        let Meta = getMeta(base_version);

        // Cast resource to Procedure Class

        // TODO: set meta info, increment meta ID
        procedure.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }
    
      // TODO: save record to database
      let cleaned = JSON.parse(JSON.stringify(procedure));
      let doc = Object.assign(cleaned, { _id: id });

      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Procedure.update: ', err2);
          return reject(err2);
        }

        let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);

        let history_procedure = Object.assign(cleaned, { id: id });

        // Return id, if recorded was created or updated, new meta version id
        return history_collection.insertOne(history_procedure, (err3) => {
          if (err3) {
            logger.error('Error with ProcedureHistory.create: ', err3);
            return reject(err3);
          }

          return resolve({
            id: id,
            created: res.lastErrorObject && !res.lastErrorObject.updatedExisting,
            resource_version: doc.meta.versionId,
          });
        });
      });
    });
  });

module.exports.remove = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> remove');

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    // TODO: delete record in database (soft/hard)
    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with Procedure.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }

      let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);
      return history_collection.deleteMany({ id: id }, (err2) => {
        if (err2) {
          logger.error('Error with Procedure.remove');
          return reject({
            // Must be 405 (Method Not Allowed) or 409 (Conflict)
            // 405 if you do not want to allow the delete
            // 409 if you can't delete because of referential
            // integrity or some other reason
            code: 409,
            message: err2.message,
          });
        }

        // Return number of records deleted
        return resolve({ deleted: _.result && _.result.n });
      });
    });
  });

module.exports.searchByVersionId = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let Procedure = getProcedure(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);

    // TODO: Query database
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, procedure) => {
        if (err) {
          logger.error('Error with Procedure.searchByVersionId: ', err);
          return reject(err);
        }

        // Cast result to Procedure Class
        if (procedure) {
          resolve(new Procedure(procedure));
        }

        // Return resource class
        resolve();
      }
    );
  });

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> history');

    // Common search params
    let { base_version } = args;

    // Search Result params
    let query = {};

    // Resource Specific params
    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);

    // TODO: Query database

    let Procedure = getProcedure(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Procedure.history: ', err);
        return reject(err);
      }
    
      // Cast all results to Procedure Class
      data.toArray().then((procedures) => {
        procedures.forEach(function (element, i, returnArray) {
          returnArray[i] = new Procedure(element);
        });

      // Return Array
      resolve(procedures);
    });
  });
});

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> historyById');

    // Common search params
    let { base_version, id } = args;

    // Search Result params
    let query = {};

    // Resource Specific params
    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }

    // TODO: Build query from Parameters
    query.id = `${id}`;

    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);

    // TODO: Query database

    let Procedure = getProcedure(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Procedure.historyById: ', err);
        return reject(err);
      }

      // Cast all results to Procedure Class
      data.toArray().then((procedures) => {
        procedures.forEach(function (element, i, returnArray) {
          returnArray[i] = new Procedure(element);
        });

        // Return Array
        resolve(procedures);
      });
    });
  });

  module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Procedure >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Procedure.searchById: ', err);
        return reject(err);
      }

      // Validate the patch
      let errors = jsonpatch.validate(patchContent, data);
      if (errors && Object.keys(errors).length > 0) {
        logger.error('Error with patch contents');
        return reject(errors);
      }
      // Make the changes indicated in the patch
      let resource = jsonpatch.applyPatch(data, patchContent).newDocument;

      let Procedure = getProcedure(base_version);
      let procedure = new Procedure(resource);

      if (data && data.meta) {
        let foundProcedure = new Procedure(data);
        let meta = foundProcedure.meta;
        meta.versionId = `${parseInt(foundProcedure.meta.versionId) + 1}`;
        procedure.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(procedure));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our procedure record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Procedure.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.PROCEDURE}_${base_version}_History`);
        let history_procedure = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our procedure record to history but don't assign _id
        return history_collection.insertOne(history_procedure, (err3) => {
          if (err3) {
            logger.error('Error with ProcedureHistory.create: ', err3);
            return reject(err3);
          }

          return resolve({
            id: doc.id,
            created: res.lastErrorObject && !res.lastErrorObject.updatedExisting,
            resource_version: doc.meta.versionId,
          });
        });
      });
    });
  });
