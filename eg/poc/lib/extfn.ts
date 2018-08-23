import {Boilerplate} from '../../src/Boilerplate';
const {logger} = Boilerplate;

export function createLog() {
  logger.info('hello from an external function');
}