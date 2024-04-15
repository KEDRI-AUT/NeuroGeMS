import React from 'react';
import PropTypes from 'prop-types';
// import { Handle } from 'react-flow-renderer';

DatasetNode.propTypes = {
  data: PropTypes.object.isRequired,
};

function DatasetNode({ data }) {
  return (
    <div className="dataset-node">
      {/* <Handle type="target" position="left" id={`${data.id}-in`} /> */}
      <div className="dataset-name">{data.label}</div>
      {/* <Handle type="source" position="right" id={`${data.id}-out`} /> */}
    </div>
  );
};

export default DatasetNode;