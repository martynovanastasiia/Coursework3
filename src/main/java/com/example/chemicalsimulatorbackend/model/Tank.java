//Tank.java

package com.example.chemicalsimulatorbackend.model;

public class Tank {
    private double currentLevel; // Поточний рівень рідини
    private final double maxCapacity; // Максимальний об'єм

    // Обладнання
    private boolean heaterOn;
    private boolean mixerOn;

    // Крани
    private Valve inputValve;
    private Valve outputValve;

    public Tank(double maxCapacity) {
        this.maxCapacity = maxCapacity;
        this.currentLevel = 0;
        this.heaterOn = false;
        this.mixerOn = false;
        this.inputValve = new Valve();
        this.outputValve = new Valve();
    }

    // Датчик нижнього рівня (порожньо)
    public boolean isLowLevelSensorTriggered() {
        return currentLevel <= 0;
    }

    // Датчик верхнього рівня (заповнено)
    public boolean isHighLevelSensorTriggered() {
        return currentLevel >= maxCapacity;
    }

    // Гетери та сетери для управління міксером та нагрівачем
    public boolean isHeaterOn() { return heaterOn; }
    public void setHeaterOn(boolean heaterOn) { this.heaterOn = heaterOn; }

    public boolean isMixerOn() { return mixerOn; }
    public void setMixerOn(boolean mixerOn) { this.mixerOn = mixerOn; }

    public double getCurrentLevel() { return currentLevel; }

    public void changeLevel(double amount) {
        this.currentLevel += amount;
        if (this.currentLevel < 0) this.currentLevel = 0;
        if (this.currentLevel > maxCapacity) this.currentLevel = maxCapacity;
    }
    public Valve getInputValve() { return inputValve; }
    public Valve getOutputValve() { return outputValve; }
}
