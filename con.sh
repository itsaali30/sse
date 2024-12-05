docker exec kafka kafka-topics --create --topic test-topic --bootstrap-server localhost:9092
docker exec -it kafka kafka-console-producer --topic test-topic --bootstrap-server localhost:9092
docker exec -it kafka kafka-console-consumer --topic test-topic --bootstrap-server localhost:9092 --from-beginning
