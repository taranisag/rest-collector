podTemplate(label: 'dockerPod', containers: [
    containerTemplate(name: 'docker', image: 'docker', ttyEnabled: true, command: 'cat'),
  ],
  volumes: [
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock'),
  ]) {
    node('dockerPod') {
        def shortCommit
        def dockerRepository
        def dockerRegistry
        def dockerTag

        stage('Clone repository') {
            checkout scm

            chartName = "reverest"
            dockerRegistry = "taranisag"
            dockerRepository = "${dockerRegistry}/${chartName}"
            shortCommit = sh(returnStdout: true, script: "git log -n 1 --pretty=format:'%h'").trim()
            dockerTag = "${BRANCH_NAME}.${shortCommit}"
            currentBuild.displayName = dockerTag
        }

        withNPM(npmrcConfig:'privateNodeRepo') {
            container('docker') {
                stage('Build Image') {
                    sh "docker build -t ${dockerRepository}:${dockerTag} ."
                }

                stage('Tests') {
                    sh "docker run ${dockerRepository}:${dockerTag} npm -c 'test'"
                }
            
                stage('Deploy') {
                    sh "docker run ${dockerRepository}:${dockerTag} npm -c 'publish'"
                }
            }
        }
    }
}