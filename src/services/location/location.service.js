/*eslint no-unused-vars: "warn"*/

const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
const { COLLECTION, CLIENT_DB } = require('../../constants');
const FHIRServer = require('@asymmetrik/node-fhir-server-core');
const moment = require('moment-timezone');
const { ObjectID } = require('mongodb');
const logger = require('@asymmetrik/node-fhir-server-core').loggers.get();
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

let getLocation = (base_version) => {
  return resolveSchema(base_version, 'Location');
};

let getMeta = (base_version) => {
  return resolveSchema(base_version, 'Meta');
};

let buildStu3SearchQuery = (args) => {
    // Common search params
    let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } =
    args;

    // Search Result params
    let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
      args;

    // Resource Specific params
    let address = args['address'];
    let address_city = args['address-city'];
    let address_country = args['address-country'];
    let address_postalcode = args['address-postalcode'];
    let address_state = args['address-state'];
    let address_use = args['address-use'];
    let endpoint = args['endpoint'];
    let identifier = args['identifier'];
    let name = args['name'];
    let near = args['near'];
    let near_distance = args['near-distance'];
    let operational_status = args['operational-status'];
    let organization = args['organization'];
    let partof = args['partof'];
    let status = args['status'];
    let type = args['type'];

    let query = {};
    let ors = [];

    if (_id) {
      query.id = _id;
    }

    if (name) {
      query.name = stringQueryBuilder(name);
    }
    
    if (partof) {
      let queryBuilder = referenceQueryBuilder(partof, 'partOf.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (type) {
      let queryBuilder = tokenQueryBuilder(type, 'code', 'physicalType.coding', '');
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
  let address = args['address'];
  let address_city = args['address-city'];
  let address_country = args['address-country'];
  let address_postalcode = args['address-postalcode'];
  let address_state = args['address-state'];
  let address_use = args['address-use'];
  let endpoint = args['endpoint'];
  let identifier = args['identifier'];
  let name = args['name'];
  let near = args['near'];
  let near_distance = args['near-distance'];
  let operational_status = args['operational-status'];
  let organization = args['organization'];
  let partof = args['partof'];
  let status = args['status'];
  let type = args['type'];

  let query = {};
  let ors = [];

  if (_id) {
    query.id = _id;
  }

  if (name) {
    query.name = stringQueryBuilder(name);
  }

  if (partof) {
    let queryBuilder = referenceQueryBuilder(partof, 'partOf.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  if (type) {
    let queryBuilder = tokenQueryBuilder(type, 'code', 'physicalType.coding', '');
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
    logger.info('Location >>> search');

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
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);
    let Location = getLocation(base_version);

    // Query our collection for this observation // TODO: Be sure this strategy is used by other services implemented
    collection.find(query).toArray().then(
      (locations) => {
        locations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Location(element);
        });
        resolve(locations);
      },
      err => {
        logger.error('Error with Location.search: ', err);
        return reject(err);
      }
    )
  });
  // };

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> searchById');

    let { base_version, id } = args;
    let Location = getLocation(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);
    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, location) => {
      if (err) {
        logger.error('Error with Location.searchById: ', err);
        return reject(err);
      }
      if (location) {
        resolve(new Location(location));
      }
      resolve();
    });
  });

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> create');

    let resource = req.body;

    let { base_version } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);

    // Make sure to use this ID when inserting this resource
    let Location = getLocation(base_version);
    let location = new Location(resource);

    // TODO: determine if client/server sets ID
    let id = getUuid(location);
    // Cast resource to Location Class
    
    // TODO: set meta info
    let Meta = getMeta(base_version);
    location.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });
    // TODO: save record to database
    let doc = JSON.parse(JSON.stringify(location.toJSON()));
    Object.assign(doc, { id: id });

    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with Location.create: ', err);
        return reject(err);
      }
    
    let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);

    return history_collection.insertOne(history_doc, (err2) => {
      if (err2) {
        logger.error('Error with LocationHistory.create: ', err2);
        return reject(err2);
      }
      return resolve({ id: doc.id, resource_version: doc.meta.versionId });
    });
  });
});

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);

    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Location.searchById: ', err);
        return reject(err);
      }

      // Cast resource to Location Class
      let Location = getLocation(base_version);
      let location = new Location(resource);

      // TODO: set meta info, increment meta ID
      if (data && data.meta) {
        let foundLocation = new Location(data);
        let meta = foundLocation.meta;
        meta.versionId = `${parseInt(foundLocation.meta.versionId) + 1}`;
        location.meta = meta;
      } else {
        let Meta = getMeta(base_version);
        location.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }

      let cleaned = JSON.parse(JSON.stringify(location));
      let doc = Object.assign(cleaned, { _id: id });

    // TODO: save record to database
    collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
      if (err2) {
        logger.error('Error with Location.update: ', err2);
        return reject(err2);
      }
    
      let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);

      let history_location = Object.assign(cleaned, { id: id });

      return history_collection.insertOne(history_location, (err3) => {
        if (err3) {
          logger.error('Error with LocationHistory.create: ', err3);
          return reject(err3);
        }
    
    // Return id, if recorded was created or updated, new meta version id
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
    logger.info('Location >>> remove');

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);
    // TODO: delete record in database (soft/hard)
    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with Location.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }

      let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);
      return history_collection.deleteMany({ id: id }, (err2) => {
        if (err2) {
          logger.error('Error with Location.remove');
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
    logger.info('Location >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let Location = getLocation(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);

    // TODO: Query database

    // Cast result to Location Class
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, location) => {
        if (err) {
          logger.error('Error with Location.searchByVersionId: ', err);
          return reject(err);
        }

        if (location) {
          resolve(new Location(location));
        }

        resolve();
      }
    );
  });

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> history');

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
    let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);
    let Location = getLocation(base_version);
    // TODO: Query database
    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Location.history: ', err);
        return reject(err);
      }

    // Cast all results to Location Class
      data.toArray().then((locations) => {
        locations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Location(element);
        });
        resolve(locations);
      });
    });
  });

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> historyById');

    // Common search params
    let { base_version, id } = args;

    // Search Result params
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
    query.id = `${id}`;
    // TODO: Query database
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);
    let Location = getLocation(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Location.historyById: ', err);
        return reject(err);
      }

    // Return Array
      data.toArray().then((locations) => {
        locations.forEach(function (element, i, returnArray) {
          returnArray[i] = new Location(element);
        });
        resolve(locations);
      });
    });
  });

  module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Location >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LOCATION}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Location.searchById: ', err);
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

      let Location = getLocation(base_version);
      let location = new Location(resource);

      if (data && data.meta) {
        let foundLocation = new Location(data);
        let meta = foundLocation.meta;
        meta.versionId = `${parseInt(foundLocation.meta.versionId) + 1}`;
        location.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(location));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our location record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Location.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.LOCATION}_${base_version}_History`);
        let history_location = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our location record to history but don't assign _id
        return history_collection.insertOne(history_location, (err3) => {
          if (err3) {
            logger.error('Error with LocationHistory.create: ', err3);
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