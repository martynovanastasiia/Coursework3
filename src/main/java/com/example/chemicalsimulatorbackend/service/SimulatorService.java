// SimulatorService.java
package com.example.chemicalsimulatorbackend.service;

import com.example.chemicalsimulatorbackend.model.Tank;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SimulatorService {

    private final Tank leftTank;
    private final Tank rightTank;
    private final Tank reactorTank;

    private String processState;
    private int timer;
    private int totalSteps;
    private String currentRecipe;
    private boolean isPaused = false;

    private final List<String> eventLog = new ArrayList<>();
    private static final int MAX_LOG_SIZE = 50; // Збільшили ліміт логів, бо їх тепер більше
    private int currentStepIndex;

    public SimulatorService() {
        this.leftTank    = new Tank(50.0);
        this.rightTank   = new Tank(50.0);
        this.reactorTank = new Tank(100.0);
        this.processState   = "ОЧІКУВАННЯ";
        this.currentRecipe  = "CHOCOLATE";
        this.timer          = 0;
        this.totalSteps     = 0;
        this.currentStepIndex = 0;
    }

    public Tank   getLeftTank()        { return leftTank; }
    public Tank   getRightTank()       { return rightTank; }
    public Tank   getReactorTank()     { return reactorTank; }
    public String getProcessState()    { return processState; }
    public String getCurrentRecipe()   { return currentRecipe; }
    public List<String> getEventLog()  { return eventLog; }
    public int    getCurrentStepIndex(){ return currentStepIndex; }
    public boolean isPaused()          { return isPaused; }

    public int getTotalProcessSteps() {
        return "MILK".equals(currentRecipe) ? 6 : 5;
    }

    public double getStepProgress() {
        if (totalSteps == 0) return 1.0;
        double remaining = Math.max(0, timer);
        return 1.0 - (remaining / (double) totalSteps);
    }

    private boolean isSingleTankRecipe() { return "MILK".equals(currentRecipe); }

    public void startProcess(String recipe) {
        if (!"ОЧІКУВАННЯ".equals(processState) && !"ЗАВЕРШЕНО".equals(processState)) return;
        this.currentRecipe  = recipe;
        this.currentStepIndex = 1;
        this.isPaused = false;
        eventLog.clear();
        leftTank.reset(); rightTank.reset(); reactorTank.reset();

        logEvent("▶ Запуск процесу: " + getRecipeName(recipe));

        if (isSingleTankRecipe()) {
            logEvent("Відкриття крана: Завантаження сирого молока...");
        } else if ("CHOCOLATE".equals(recipe)) {
            logEvent("Відкриття кранів: Завантаження какао-бобів, масла та цукру...");
        } else {
            logEvent("Відкриття кранів: Завантаження олій та лугу...");
        }

        processState = "ЗАПОВНЕННЯ";
        leftTank.getInputValve().setControlSignal(true);
        if (!isSingleTankRecipe()) rightTank.getInputValve().setControlSignal(true);
    }

    public void togglePause() {
        if (!"ОЧІКУВАННЯ".equals(processState) && !"ЗАВЕРШЕНО".equals(processState)) {
            this.isPaused = !this.isPaused;
            logEvent(isPaused ? "⏸ Процес призупинено (Пауза)" : "▶ Процес відновлено");
        }
    }

    // ОНОВЛЕНА ЛОГІКА СКИДАННЯ
    public void resetProcess() {
        if ("ЗАВЕРШЕНО".equals(processState)) {
            eventLog.clear();
            logEvent("Систему очищено та підготовлено до нового циклу");
        } else if (!"ОЧІКУВАННЯ".equals(processState)) {
            logEvent("🛑 Симуляцію примусово перервано користувачем!");
        }

        processState = "ОЧІКУВАННЯ";
        timer = 0; totalSteps = 0; currentStepIndex = 0;
        isPaused = false;
        leftTank.reset(); rightTank.reset(); reactorTank.reset();
    }

    public void processTick() {
        if (isPaused) return;

        leftTank.simulateTemperature();
        rightTank.simulateTemperature();
        reactorTank.simulateTemperature();

        switch (processState) {
            case "ЗАПОВНЕННЯ":
                leftTank.changeLevel(0.5);
                if (!isSingleTankRecipe()) rightTank.changeLevel(0.5);

                if (leftTank.isHighLevelSensorTriggered() && (isSingleTankRecipe() || rightTank.isHighLevelSensorTriggered())) {
                    leftTank.getInputValve().setControlSignal(false);
                    rightTank.getInputValve().setControlSignal(false);
                    currentStepIndex = 2; timer = 80; totalSteps = 80; processState = "ПІДГОТОВКА";

                    logEvent("Компоненти успішно завантажені у верхні баки.");
                    applyPreparationSettings();
                }
                break;

            case "ПІДГОТОВКА":
                timer--;
                if (timer <= 0) {
                    leftTank.setHeaterOn(false); leftTank.setMixerOn(false);
                    rightTank.setHeaterOn(false); rightTank.setMixerOn(false);
                    currentStepIndex = 3; processState = "ПЕРЕДАЧА";

                    leftTank.getOutputValve().setControlSignal(true);
                    if (!isSingleTankRecipe()) rightTank.getOutputValve().setControlSignal(true);
                    reactorTank.getInputValve().setControlSignal(true);

                    logEvent("Підготовку завершено. Відкриття нижніх кранів...");
                    if (isSingleTankRecipe()) {
                        logEvent("Початок передачі. Відбувається процес фільтрації молока...");
                    } else {
                        logEvent("Початок злиття компонентів до реактора...");
                    }
                }
                break;

            case "ПЕРЕДАЧА":
                double incomingTemp = isSingleTankRecipe() ? leftTank.getTemperature() : (leftTank.getTemperature() + rightTank.getTemperature()) / 2.0;
                double incomingFlow = isSingleTankRecipe() ? 0.5 : 1.0;

                double currentVol = reactorTank.getCurrentLevel();
                double newVol = currentVol + incomingFlow;
                double mixedTemp = (reactorTank.getTemperature() * currentVol + incomingTemp * incomingFlow) / newVol;

                leftTank.changeLevel(-0.5);
                if (!isSingleTankRecipe()) rightTank.changeLevel(-0.5);

                reactorTank.changeLevel(incomingFlow);
                reactorTank.setTemperature(mixedTemp);
                reactorTank.setTargetTemperature(mixedTemp);

                if (leftTank.isLowLevelSensorTriggered() && (isSingleTankRecipe() || rightTank.isLowLevelSensorTriggered())) {
                    leftTank.getOutputValve().setControlSignal(false); rightTank.getOutputValve().setControlSignal(false);
                    reactorTank.getInputValve().setControlSignal(false);
                    currentStepIndex = 4; timer = 100; totalSteps = 100; processState = "ОБРОБКА";

                    logEvent("Передача завершена. Температура суміші: " + String.format("%.1f", mixedTemp) + "°C");
                    applySynthesisSettings();
                }
                break;

            case "ОБРОБКА":
                timer--;
                if (timer <= 0) {
                    reactorTank.setHeaterOn(false);
                    if (isSingleTankRecipe()) {
                        currentStepIndex = 5; timer = 60; totalSteps = 60; processState = "ОХОЛОДЖЕННЯ";
                        reactorTank.setTargetTemperature(20.0);
                        logEvent("Обробка завершена. Початок етапу охолодження...");
                    } else {
                        reactorTank.setMixerOn(false);
                        currentStepIndex = 5; processState = "ВИВАНТАЖЕННЯ";
                        reactorTank.getOutputValve().setControlSignal(true);
                        logEvent("Обробка завершена. Відкриття крана для вивантаження...");
                    }
                }
                break;

            case "ОХОЛОДЖЕННЯ":
                double tempDiff = reactorTank.getTemperature() - 20.0;
                if (tempDiff > 0) reactorTank.setTemperature(Math.max(20.0, reactorTank.getTemperature() - (tempDiff / Math.max(1, timer))));

                timer--;
                if (timer <= 0) {
                    reactorTank.setMixerOn(false);
                    currentStepIndex = 6; processState = "ВИВАНТАЖЕННЯ";
                    reactorTank.getOutputValve().setControlSignal(true);
                    logEvent("Охолодження до 20°C завершено. Вивантаження продукту...");
                }
                break;

            case "ВИВАНТАЖЕННЯ":
                reactorTank.changeLevel(-0.5);
                if (reactorTank.isLowLevelSensorTriggered()) {
                    reactorTank.getOutputValve().setControlSignal(false); processState = "ЗАВЕРШЕНО";
                    logEvent("✅ Продукт готовий: " + getRecipeName(currentRecipe));
                }
                break;
        }
    }

    private void applyPreparationSettings() {
        switch (currentRecipe) {
            case "SOAP":
                leftTank.setHeaterOn(true); leftTank.setTargetTemperature(80.0); rightTank.setMixerOn(true);
                logEvent("Лівий бак: Увімкнено нагрівання олій до 80°C");
                logEvent("Правий бак: Перемішування лужного розчину");
                break;
            case "CHOCOLATE":
                leftTank.setHeaterOn(true); leftTank.setMixerOn(true); leftTank.setTargetTemperature(55.0);
                rightTank.setHeaterOn(true); rightTank.setTargetTemperature(45.0);
                logEvent("Лівий бак: Робота гріндера. Подрібнення та нагрів бобів до 55°C");
                logEvent("Правий бак: Розтоплення масла з цукром до 45°C");
                break;
            case "MILK":
                leftTank.setMixerOn(true);
                logEvent("Верхній бак: Попереднє перемішування молока");
                break;
        }
    }

    private void applySynthesisSettings() {
        switch (currentRecipe) {
            case "SOAP":
                reactorTank.setHeaterOn(true); reactorTank.setMixerOn(true); reactorTank.setTargetTemperature(70.0);
                logEvent("Реактор: Омилення при 70°C. Працює міксер");
                break;
            case "CHOCOLATE":
                reactorTank.setHeaterOn(true); reactorTank.setMixerOn(true); reactorTank.setTargetTemperature(50.0);
                logEvent("Реактор: Конширування при 50°C. Інтенсивне змішування");
                break;
            case "MILK":
                reactorTank.setHeaterOn(true); reactorTank.setMixerOn(true); reactorTank.setTargetTemperature(85.0);
                logEvent("Реактор: Пастеризація при 85°C. Працює міксер");
                break;
        }
    }

    private String getRecipeName(String recipe) {
        switch (recipe) { case "SOAP": return "Еко-Мило"; case "CHOCOLATE": return "Крафт Шоколад"; case "MILK": return "Пастеризоване Молоко"; default: return recipe; }
    }

    private void logEvent(String message) {
        if (eventLog.size() >= MAX_LOG_SIZE) eventLog.remove(0);
        eventLog.add(message);
    }
}