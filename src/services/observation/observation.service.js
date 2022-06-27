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

let getObservation = (base_version) => {
  return resolveSchema(base_version, 'Observation');
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
    let code_value_concept = args['code-value-concept'];
    let code_value_date = args['code-value-date'];
    let code_value_quantity = args['code-value-quantity'];
    let code_value_string = args['code-value-string'];
    let combo_code = args['combo-code'];
    let combo_code_value_concept = args['combo-code-value-concept'];
    let combo_code_value_quantity = args['combo-code-value-quantity'];
    let combo_data_absent_reason = args['combo-data-absent-reason'];
    let combo_value_concept = args['combo-value-concept'];
    let combo_value_quantity = args['combo-value-quantity'];
    let component_code = args['component-code'];
    let component_code_value_concept = args['component-code-value-concept'];
    let component_code_value_quantity = args['component-code-value-quantity'];
    let component_data_absent_reason = args['component-data-absent-reason'];
    let component_value_concept = args['component-value-concept'];
    let component_value_quantity = args['component-value-quantity'];
    let _context = args['_context'];
    let data_absent_reason = args['data-absent-reason'];
    let date = args['date'];
    let device = args['device'];
    let encounter = args['encounter'];
    let identifier = args['identifier'];
    let method = args['method'];
    let patient = args['patient'];
    let performer = args['performer'];
    let related = args['related'];
    let related_target = args['related-target'];
    let related_type = args['related-type'];
    let specimen = args['specimen'];
    let status = args['status'];
    let reference = args['reference'];
    let value_concept = args['value-concept'];
    let value_date = args['value-date'];
    let value_quantity = args['value-quantity'];
    let value_string = args['value-string'];

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

    if (encounter) {
      let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (performer) {
      let queryBuilder = referenceQueryBuilder(performer, 'performer.reference');
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
    let code_value_concept = args['code-value-concept'];
    let code_value_date = args['code-value-date'];
    let code_value_quantity = args['code-value-quantity'];
    let code_value_string = args['code-value-string'];
    let combo_code = args['combo-code'];
    let combo_code_value_concept = args['combo-code-value-concept'];
    let combo_code_value_quantity = args['combo-code-value-quantity'];
    let combo_data_absent_reason = args['combo-data-absent-reason'];
    let combo_value_concept = args['combo-value-concept'];
    let combo_value_quantity = args['combo-value-quantity'];
    let component_code = args['component-code'];
    let component_code_value_concept = args['component-code-value-concept'];
    let component_code_value_quantity = args['component-code-value-quantity'];
    let component_data_absent_reason = args['component-data-absent-reason'];
    let component_value_concept = args['component-value-concept'];
    let component_value_quantity = args['component-value-quantity'];
    let _context = args['_context'];
    let data_absent_reason = args['data-absent-reason'];
    let date = args['date'];
    let device = args['device'];
    let encounter = args['encounter'];
    let identifier = args['identifier'];
    let method = args['method'];
    let patient = args['patient'];
    let performer = args['performer'];
    let related = args['related'];
    let related_target = args['related-target'];
    let related_type = args['related-type'];
    let specimen = args['specimen'];
    let status = args['status'];
    let reference = args['reference'];
    let value_concept = args['value-concept'];
    let value_date = args['value-date'];
    let value_quantity = args['value-quantity'];
    let value_string = args['value-string'];

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

    if (encounter) {
      let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (performer) {
      let queryBuilder = referenceQueryBuilder(performer, 'performer.reference');
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
    logger.info('Observation >>> search');

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

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);

    // TODO: Query database

    let Observation = getObservation(base_version);

    collection.find(query).toArray().then(
      (observations) => {
        observations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Observation(element);
        });
    // Cast all results to Observation Class

    // TODO: Set data with constructor or setter methods

    // Return Array
        resolve(observations);
      },
      err => {
        logger.error('Error with Obsersavtion.search: ', err);
        return reject(err);
      }
    )
});

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> searchById');

    let { base_version, id } = args;

    let Observation = getObservation(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);
    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, observation) => {
      if (err) {
        logger.error('Error with Observation.searchById: ', err);
        return reject(err);
      }
      if (observation) {
    // Cast result to Observation Class

    // TODO: Set data with constructor or setter methods


    // Return resource class
    // resolve(observation_resource);
        resolve(new Observation(observation));
      }
      resolve();
    });
  });

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> create');

    let resource = req.body;

    let { base_version } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);

    let Observation = getObservation(base_version);
    let observation = new Observation(resource);

    // Make sure to use this ID when inserting this resource
    let id = getUuid(observation);

    let Meta = getMeta(base_version);

    // TODO: determine if client/server sets ID

    // Cast resource to Observation Class

    // TODO: set meta info
    observation.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });

    // TODO: save record to database
    let doc = JSON.parse(JSON.stringify(observation.toJSON()));
    Object.assign(doc, { id: id });

    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with Observation.create: ', err);
        return reject(err);
      }
    
    let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);

    // Return Id
      return history_collection.insertOne(history_doc, (err2) => {
        if (err2) {
          logger.error('Error with ObservationHistory.create: ', err2);
          return reject(err2);
        }
        return resolve({ id: doc.id, resource_version: doc.meta.versionId });
      });
    });
  });

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);

    // Cast resource to Observation Class
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Observation.searchById: ', err);
        return reject(err);
      }

      let Observation = getObservation(base_version);
      let observation = new Observation(resource);

      // TODO: set meta info, increment meta ID
      if (data && data.meta) {
        let foundObservation = new Observation(data);
        let meta = foundObservation.meta;
        meta.versionId = `${parseInt(foundObservation.meta.versionId) + 1}`;
        observation.meta = meta;
      } else {
        let Meta = getMeta(base_version);
        observation.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }
      
      let cleaned = JSON.parse(JSON.stringify(observation));
      let doc = Object.assign(cleaned, { _id: id });

      // TODO: save record to database
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Observation.update: ', err2);
          return reject(err2);
        }

        let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);

        let history_observation = Object.assign(cleaned, { id: id });

        // Return id, if recorded was created or updated, new meta version id
        return history_collection.insertOne(history_observation, (err3) => {
          if (err3) {
            logger.error('Error with ObservationHistory.create: ', err3);
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
    logger.info('Observation >>> remove');

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);
    
    // TODO: delete record in database (soft/hard)
    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with Observation.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }

    let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);
    return history_collection.deleteMany({ id: id }, (err2) => {
      if (err2) {
        logger.error('Error with Observation.remove');
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
    logger.info('Observation >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let Observation = getObservation(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);

    // TODO: Query database
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, observation) => {
        if (err) {
          logger.error('Error with Observation.searchByVersionId: ', err);
          return reject(err);
        }

        // Cast result to Observation Class

        // Return resource class
        if (observation) {
          resolve(new Observation(observation));
        }

        resolve();
      }
    );
  });

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> history');

    // Common search params
    let { base_version } = args;

    // Search Result params
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

    // Resource Specific params
    let db = globals.get(CLIENT_DB);

    // TODO: Build query from Parameters
    let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);

    // TODO: Query database

    let Observation = getObservation(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Observation.history: ', err);
        return reject(err);
      }

      // Cast all results to Observation Class
      data.toArray().then((observations) => {
        observations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Observation(element);
        });
      // Return Array
      resolve(observations);
    });
  });
});

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> historyById');

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
    let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);
    // TODO: Query database

    let Observation = getObservation(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Observation.historyById: ', err);
        return reject(err);
      }

      // Cast all results to Observation Class
      data.toArray().then((observations) => {
        observations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Observation(element);
        });

      // Return Array
      resolve(observations);
    });
  });
});

module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Observation >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Observation.searchById: ', err);
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

      let Observation = getObservation(base_version);
      let observation = new Observation(resource);

      if (data && data.meta) {
        let foundObservation = new Observation(data);
        let meta = foundObservation.meta;
        meta.versionId = `${parseInt(foundObservation.meta.versionId) + 1}`;
        observation.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(observation));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our observation record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Observation.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.OBSERVATION}_${base_version}_History`);
        let history_observation = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our observatoin record to history but don't assign _id
        return history_collection.insertOne(history_observation, (err3) => {
          if (err3) {
            logger.error('Error with ObservationHistory.create: ', err3);
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