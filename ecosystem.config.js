module.exports = {
    apps: [
        {
            name: 'scc-backend',
            cwd: './backend',
            script: 'cmd',
            args: ['/c', 'npm run dev'],
            env: {
                NODE_ENV: 'development'
            }
        },
        {
            name: 'scc-frontend',
            cwd: './frontend',
            script: 'cmd',
            args: ['/c', 'npm start'],
            env: {
                NODE_ENV: 'development'
            }
        }
    ]
}
