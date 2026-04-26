package com.example.chemicalsimulatorbackend.service;

import com.example.chemicalsimulatorbackend.model.Tank;
import org.springframework.stereotype.Service;

@Service
public class SimulatorService {

    private final Tank leftTank; // Раніше oilTank
    private final Tank rightTank; // Раніше lyeTank
    private final Tank reactorTank;

    private String processState;
    private int timer;
    private String currentRecipe = "SOAP"; // Зберігаємо поточний рецепт

    public SimulatorService() {
        this.leftTank = new Tank(50.0);
        this.rightTank = new Tank(50.0);
        this.reactorTank = new Tank(100.0);
        this.processState = "IDLE";
        this.timer = 0;
    }

    public Tank getLeftTank() { return leftTank; }
    public Tank getRightTank() { return rightTank; }
    public Tank getReactorTank() { return reactorTank; }
    public String getProcessState() { return processState; }
    public String getCurrentRecipe() { return currentRecipe; }

    public void startProcess(String recipe) {
        if (processState.equals("IDLE")) {
            this.currentRecipe = recipe;
            processState = "FILLING COMPONENTS";
            leftTank.getInputValve().setControlSignal(true);
            rightTank.getInputValve().setControlSignal(true);
        }
    }

    // НОВИЙ МЕТОД: Аварійна зупинка
    public void stopProcess() {
        processState = "IDLE";
        timer = 0;

        // Закриваємо всі крани
        leftTank.getInputValve().setControlSignal(false);
        leftTank.getOutputValve().setControlSignal(false);
        rightTank.getInputValve().setControlSignal(false);
        rightTank.getOutputValve().setControlSignal(false);
        reactorTank.getInputValve().setControlSignal(false);
        reactorTank.getOutputValve().setControlSignal(false);

        // Вимикаємо обладнання
        leftTank.setHeaterOn(false); leftTank.setMixerOn(false);
        rightTank.setHeaterOn(false); rightTank.setMixerOn(false);
        reactorTank.setHeaterOn(false); reactorTank.setMixerOn(false);

        // Скидаємо рівні рідин до нуля (швидкий злив при аварії)
        leftTank.changeLevel(-leftTank.getCurrentLevel());
        rightTank.changeLevel(-rightTank.getCurrentLevel());
        reactorTank.changeLevel(-reactorTank.getCurrentLevel());
    }

    public void processTick() {
        switch (processState) {
            case "FILLING COMPONENTS":
                leftTank.changeLevel(0.5);
                rightTank.changeLevel(0.5);

                if (leftTank.isHighLevelSensorTriggered() && rightTank.isHighLevelSensorTriggered()) {
                    leftTank.getInputValve().setControlSignal(false);
                    rightTank.getInputValve().setControlSignal(false);
                    processState = "PREPARING (HEAT & MIX)";
                    timer = 80;

                    // ДИНАМІЧНА ЛОГІКА ЗАЛЕЖНО ВІД РЕЦЕПТА
                    if (currentRecipe.equals("SOAP")) {
                        leftTank.setHeaterOn(true);
                        rightTank.setMixerOn(true);
                    } else if (currentRecipe.equals("CHOCOLATE")) {
                        leftTank.setHeaterOn(true); leftTank.setMixerOn(true); // Гріндер+Нагрів
                        rightTank.setHeaterOn(true);
                    } else if (currentRecipe.equals("LEMONADE")) {
                        leftTank.setHeaterOn(true); leftTank.setMixerOn(true);
                        // Правий бак просто дозатор, нічого не вмикаємо
                    }
                }
                break;

            case "PREPARING (HEAT & MIX)":
                timer--;
                if (timer <= 0) {
                    leftTank.setHeaterOn(false); leftTank.setMixerOn(false);
                    rightTank.setHeaterOn(false); rightTank.setMixerOn(false);
                    processState = "TRANSFERRING TO REACTOR";
                    leftTank.getOutputValve().setControlSignal(true);
                    rightTank.getOutputValve().setControlSignal(true);
                    reactorTank.getInputValve().setControlSignal(true);
                }
                break;

            case "TRANSFERRING TO REACTOR":
                leftTank.changeLevel(-0.5);
                rightTank.changeLevel(-0.5);
                reactorTank.changeLevel(1.0);

                if (leftTank.isLowLevelSensorTriggered() && rightTank.isLowLevelSensorTriggered()) {
                    leftTank.getOutputValve().setControlSignal(false);
                    rightTank.getOutputValve().setControlSignal(false);
                    reactorTank.getInputValve().setControlSignal(false);
                    processState = "SYNTHESIS REACTION";
                    timer = 120;

                    if (currentRecipe.equals("SOAP")) {
                        reactorTank.setHeaterOn(true); reactorTank.setMixerOn(true);
                    } else if (currentRecipe.equals("CHOCOLATE")) {
                        reactorTank.setHeaterOn(true); reactorTank.setMixerOn(true);
                    } else if (currentRecipe.equals("LEMONADE")) {
                        reactorTank.setMixerOn(true); // Карбонізація
                    }
                }
                break;

            case "SYNTHESIS REACTION":
                timer--;
                if (timer <= 0) {
                    reactorTank.setHeaterOn(false); reactorTank.setMixerOn(false);
                    processState = "UNLOADING PRODUCT";
                    reactorTank.getOutputValve().setControlSignal(true);
                }
                break;

            case "UNLOADING PRODUCT":
                reactorTank.changeLevel(-0.5);
                if (reactorTank.isLowLevelSensorTriggered()) {
                    reactorTank.getOutputValve().setControlSignal(false);
                    processState = "DONE"; // Змінили на DONE для фронтенду
                }
                break;
        }
    }
}