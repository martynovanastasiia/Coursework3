# Етап 1: Збірка проєкту за допомогою Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Етап 2: Створення легкого контейнера для запуску
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Відкриваємо порт 8080
EXPOSE 8080

# Команда для запуску симулятора
ENTRYPOINT ["java", "-jar", "app.jar"]