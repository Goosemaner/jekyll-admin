import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory, withRouter, Link } from 'react-router';
import _ from 'underscore';
import { HotKeys } from 'react-hotkeys';
import Breadcrumbs from '../../components/Breadcrumbs';
import InputPath from '../../components/form/InputPath';
import Splitter from '../../components/Splitter';
import Errors from '../../components/Errors';
import Editor from '../../components/Editor';
import Button from '../../components/Button';
import { clearErrors } from '../../actions/utils';
import { getFilenameFromPath, preventDefault } from '../../utils/helpers';
import {
  fetchDataFile, putDataFile, deleteDataFile, onDataFileChanged
} from '../../actions/datafiles';
import {
  getLeaveMessage, getDeleteMessage, getNotFoundMessage
} from '../../constants/lang';
import { ADMIN_PREFIX } from '../../constants';

export class DataFileEdit extends Component {

  constructor(props) {
    super(props);
    this.handleClickSave = this.handleClickSave.bind(this);
  }

  componentDidMount() {
    const { fetchDataFile, params, router, route } = this.props;
    const [directory, ...rest] = params.splat || [""];
    const filename = rest.join('.');

    router.setRouteLeaveHook(route, this.routerWillLeave.bind(this));
    fetchDataFile(directory, filename);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.updated !== nextProps.updated) {
      const new_path = nextProps.datafile.path;
      const new_relative_path = nextProps.datafile.relative_path;
      const path = this.props.datafile.path;

      // redirect if the path is changed
      if (new_path != path) {
        browserHistory.push(`${ADMIN_PREFIX}/datafiles/${new_relative_path}`);
      }
    }
  }

  componentWillUnmount() {
    const { clearErrors, errors} = this.props;
    // clear errors if any
    if (errors.length) {
      clearErrors();
    }
  }

  routerWillLeave(nextLocation) {
    if (this.props.datafileChanged) {
      return getLeaveMessage();
    }
  }

  handleClickSave(e) {
    const { datafile, datafileChanged, putDataFile, params } = this.props;
    const { path, relative_path } = datafile;
    const data_dir = path.replace(relative_path, "");
    const [directory, ...rest] = params.splat || [""];
    const filename = rest.join('.');

    // Prevent the default event from bubbling
    preventDefault(e);

    if (datafileChanged) {
      const value = this.refs.editor.getValue();
      const new_path = data_dir + this.refs.inputpath.refs.input.value;
      putDataFile(directory, filename, value, new_path);
    }
  }

  handleClickDelete(path) {
    const { deleteDataFile, params } = this.props;
    const confirm = window.confirm(getDeleteMessage(path));

    if (confirm) {
      const [directory, ...rest] = params.splat || [""];
      const filename = getFilenameFromPath(path);
      deleteDataFile(directory, filename);
      browserHistory.push(`${ADMIN_PREFIX}/datafiles`);
    }
  }

  render() {
    const {
      datafileChanged, onDataFileChanged, datafile, isFetching,
      updated, errors, params
    } = this.props;

    if (isFetching) {
      return null;
    }

    if (_.isEmpty(datafile)) {
      return <h1>{getNotFoundMessage("data file")}</h1>;
    }

    const { path, relative_path, raw_content } = datafile;
    const [directory, ...rest] = params.splat || [""];
    const filename = getFilenameFromPath(path);

    const keyboardHandlers = {
      'save': this.handleClickSave,
    };

    return (
      <HotKeys
        handlers={keyboardHandlers}
        className="single">
        {errors.length > 0 && <Errors errors={errors} />}
        <div className="content-header">
          <Breadcrumbs splat={directory || ""} type="data files" />
        </div>

        <div className="content-wrapper">
          <div className="content-body">
            <InputPath
              onChange={onDataFileChanged}
              type="data files"
              path={relative_path}
              ref="inputpath" />
            <Editor
              editorChanged={datafileChanged}
              onEditorChange={onDataFileChanged}
              content={raw_content}
              ref="editor" />
          </div>

          <div className="content-side">
            <Button
              onClick={this.handleClickSave}
              type="save"
              active={datafileChanged}
              triggered={updated}
              icon="save"
              block />
            <Splitter />
            <Button
              onClick={() => this.handleClickDelete(relative_path)}
              type="delete"
              active={true}
              icon="trash"
              block />
          </div>
        </div>
      </HotKeys>
    );
  }
}

DataFileEdit.propTypes = {
  fetchDataFile: PropTypes.func.isRequired,
  putDataFile: PropTypes.func.isRequired,
  deleteDataFile: PropTypes.func.isRequired,
  clearErrors: PropTypes.func.isRequired,
  datafile: PropTypes.object.isRequired,
  onDataFileChanged: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  updated: PropTypes.bool.isRequired,
  datafileChanged: PropTypes.bool.isRequired,
  errors: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  datafile: state.datafiles.currentFile,
  isFetching: state.datafiles.isFetching,
  updated: state.datafiles.updated,
  datafileChanged: state.datafiles.datafileChanged,
  errors: state.utils.errors
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchDataFile,
  putDataFile,
  deleteDataFile,
  onDataFileChanged,
  clearErrors
}, dispatch);

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(DataFileEdit)
);
