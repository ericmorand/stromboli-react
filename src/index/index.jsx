const React = require('react');
const ReactDOM = require('react-dom');

class Index extends React.Component {
    render() {
        return <div>Hello world!</div>;
    }
}

ReactDOM.render(
    <Index/>,
    document.getElementById("app")
);