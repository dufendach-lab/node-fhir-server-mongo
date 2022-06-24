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

let getEncounter = (base_version) => {
  return resolveSchema(base_version, 'Encounter');
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
  let appointment = args['appointment'];
  let _class = args['_class'];
  let date = args['date'];
  let diagnosis = args['diagnosis'];
  let episodeofcare = args['episodeofcare'];
  let identifier = args['identifier'];
  let incomingreferral = args['incomingreferral'];
  let length = args['length'];
  let location = args['location'];
  let location_period = args['location-period'];
  let part_of = args['part-of'];
  let participant = args['participant'];
  let participant_type = args['participant-type'];
  let patient = args['patient'];
  let practitioner = args['practitioner'];
  let reason = args['reason'];
  let service_provider = args['service-provider'];
  let special_arrangement = args['special-arrangement'];
  let status = args['status'];
  let subject = args['subject'];
  let type = args['type'];

  let query = {};
  let ors = [];

  if (_id) {
    query.id = _id;
  }

  if (location) {
    let queryBuilder = referenceQueryBuilder(location, 'location.location.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  return query;
};

let buildDstu2SearchQuery = (args) => {
  // Common search params
  let { _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

  // Search Result params
  let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
    args;

  // Resource Specific params
  let appointment = args['appointment'];
  let _class = args['_class'];
  let date = args['date'];
  let diagnosis = args['diagnosis'];
  let episodeofcare = args['episodeofcare'];
  let identifier = args['identifier'];
  let incomingreferral = args['incomingreferral'];
  let length = args['length'];
  let location = args['location'];
  let location_period = args['location-period'];
  let part_of = args['part-of'];
  let participant = args['participant'];
  let participant_type = args['participant-type'];
  let patient = args['patient'];
  let practitioner = args['practitioner'];
  let reason = args['reason'];
  let service_provider = args['service-provider'];
  let special_arrangement = args['special-arrangement'];
  let status = args['status'];
  let subject = args['subject'];
  let type = args['type'];

  let query = {};
  let ors = [];

  if (_id) {
    query.id = _id;
  }

  if (location) {
    let queryBuilder = referenceQueryBuilder(location, 'location.location.reference');
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
    logger.info('Encounter >>> search');

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
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);
    let Encounter = getEncounter(base_version);

    // Cast all results to Encounter Class
    collection.find(query).toArray().then(
      (encounters) => {
        encounters.forEach(function (element, i, returnArray) {
          returnArray[i] = new Encounter(element);
        });
    // TODO: Set data with constructor or setter methods

    // Return Array
    resolve(encounters);
  },
  err => {
    logger.error('Error with Encounter.search: ', err);
    return reject(err);
  }
)
});

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> searchById');

    let { base_version, id } = args;

    let Encounter = getEncounter(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);
    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, encounter) => {
      if (err) {
        logger.error('Error with Encounter.searchById: ', err);
        return reject(err);
      }
    // Cast result to Encounter Class

    // TODO: Set data with constructor or setter methods

    // Return resource class
    // resolve(encounter_resource);
    if (encounter) {
      resolve(new Encounter(encounter));
    }
    resolve();
  });
});

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> create');

    let resource = req.body;

    let { base_version } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);
    // Make sure to use this ID when inserting this resource
    let Encounter = getEncounter(base_version);
    let encounter = new Encounter(resource);


    // TODO: determine if client/server sets ID
    let id = getUuid(encounter);
    // Cast resource to Encounter Class
  
    // TODO: set meta info
    let Meta = getMeta(base_version);
    encounter.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });

    let doc = JSON.parse(JSON.stringify(encounter.toJSON()));
    Object.assign(doc, { id: id });
    
    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    // TODO: save record to database
    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with Encounter.create: ', err);
        return reject(err);
      }

      let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);

      return history_collection.insertOne(history_doc, (err2) => {
        if (err2) {
          logger.error('Error with EncounterHistory.create: ', err2);
          return reject(err2);
        }
    // Return Id
    return resolve({ id: doc.id, resource_version: doc.meta.versionId });
  });
});
});

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);

    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Encounter.searchById: ', err);
        return reject(err);
      }

      // Cast resource to Encounter Class
      let Encounter = getEncounter(base_version);
      let encounter = new Encounter(resource);
      
      // TODO: set meta info, increment meta ID
      if (data && data.meta) {
        let foundEncounter = new Encounter(data);
        let meta = foundEncounter.meta;
        meta.versionId = `${parseInt(foundEncounter.meta.versionId) + 1}`;
        encounter.meta = meta;
      } else {
        let Meta = getMeta(base_version);
        encounter.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }

      let cleaned = JSON.parse(JSON.stringify(encounter));
      let doc = Object.assign(cleaned, { _id: id });

      // TODO: save record to database
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Encounter.update: ', err2);
          return reject(err2);
        }

        let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);

        let history_encounter = Object.assign(cleaned, { id: id });

        // Return id, if recorded was created or updated, new meta version id
        return history_collection.insertOne(history_encounter, (err3) => {
          if (err3) {
            logger.error('Error with EncounterHistory.create: ', err3);
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
    logger.info('Encounter >>> remove');

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);

    // TODO: delete record in database (soft/hard)
    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with Encounter.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }

      let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);
      return history_collection.deleteMany({ id: id }, (err2) => {
        if (err2) {
          logger.error('Error with Encounter.remove');
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
    logger.info('Encounter >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let Encounter = getEncounter(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);

    // TODO: Query database
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, encounter) => {
        if (err) {
          logger.error('Error with Encounter.searchByVersionId: ', err);
          return reject(err);
        }

        // Cast result to Encounter Class

        // Return resource class
        if (encounter) {
          resolve(new Encounter(encounter));
        }

        resolve();
      }
    );
  });

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> history');

    // Common search params
    let { base_version } = args;

    // Search Result params

    // Resource Specific params

    // TODO: Build query from Parameters
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

    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);

    // TODO: Query database

    let Encounter = getEncounter(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Encounter.history: ', err);
        return reject(err);
      }

    // Cast all results to Encounter Class
    data.toArray().then((encounters) => {
      encounters.forEach(function (element, i, returnArray) {
        returnArray[i] = new Encounter(element);
      });

      // Return Array
      resolve(encounters);
    });
  });
});

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> historyById');

    // Common search params
    let { base_version, id } = args;

    // Search Result params

    // Resource Specific params

    // TODO: Build query from Parameters
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

    query.id = `${id}`;

    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);

    // TODO: Query database

    let Encounter = getEncounter(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Encounter.historyById: ', err);
        return reject(err);
      }

    // Cast all results to Encounter Class
    data.toArray().then((encounters) => {
      encounters.forEach(function (element, i, returnArray) {
        returnArray[i] = new Encounter(element);
      });

      // Return Array
      resolve(encounters);
    });
  });
});

module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Encounter >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Encounter.searchById: ', err);
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

      let Encounter = getEncounter(base_version);
      let encounter = new Encounter(resource);

      if (data && data.meta) {
        let foundEncounter = new Encounter(data);
        let meta = foundEncounter.meta;
        meta.versionId = `${parseInt(foundEncounter.meta.versionId) + 1}`;
        encounter.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(encounter));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our encounter record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Encounter.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.ENCOUNTER}_${base_version}_History`);
        let history_encounter = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our encounter record to history but don't assign _id
        return history_collection.insertOne(history_encounter, (err3) => {
          if (err3) {
            logger.error('Error with EncounterHistory.create: ', err3);
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