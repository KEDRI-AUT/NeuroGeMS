import { faker } from '@faker-js/faker';
import { sample } from 'lodash';

// ----------------------------------------------------------------------

const models = [...Array(24)].map((_, index) => ({
  id: faker.datatype.uuid(),
  // avatarUrl: `/assets/images/avatars/avatar_${index + 1}.jpg`,
  name: faker.internet.domainWord(),
  accuracy: faker.datatype.number({ min: 10, max: 100, precision: 0.01 }),
  report: faker.datatype.boolean(),
  status: sample(['completed', 'failed']),
  validation: sample([
    'Leave One Out',
    'K-Fold',
    'Stratified K-Fold',
    'Repeated K-Fold',
    'Repeated Stratified K-Fold',
    'Time Series Split',
    'Leave P Out',
    'Shuffle Split',
    'Group Shuffle Split',
    'Stratified Shuffle Split',
    'Predefined Split',
    'Leave One Group Out',
    'Leave P Groups Out',
    'Group K Fold',
    'Group Shuffle Split',
    'Stratified Group K Fold',
    'Holdout'
  ])
}));

export default models;
