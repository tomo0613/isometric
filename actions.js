const _tmp = {};

export default {
    walk: {
        init: (subject, path) => {
            _tmp.path = path;

            subject.changeListener.addListener('targetReached', targetReachHandler);
            subject.moveTo(_tmp.path[0]);

            function targetReachHandler() {
                _tmp.path.shift();

                if (_tmp.path.length) {
                    subject.moveTo(_tmp.path[0]);
                } else {
                    subject.changeListener.removeListener('targetReached', targetReachHandler);
                    subject.terminateAction();
                }
            }
        },
        terminate: (subject) => {
        },
    },
};
