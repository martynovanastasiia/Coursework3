//SimulatorController.java
package com.example.chemicalsimulatorbackend.controller;

import com.example.chemicalsimulatorbackend.model.Tank;
import com.example.chemicalsimulatorbackend.service.SimulatorService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "http://localhost:5173")
public class SimulatorController {

    private final SimulatorService simulatorService;

    public SimulatorController(SimulatorService simulatorService) {
        this.simulatorService = simulatorService;
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("processState", simulatorService.getProcessState());
        response.put("currentRecipe", simulatorService.getCurrentRecipe());
        response.put("oilTank", extractTankData(simulatorService.getLeftTank())); // Залишив ключі для фронту
        response.put("lyeTank", extractTankData(simulatorService.getRightTank()));
        response.put("reactorTank", extractTankData(simulatorService.getReactorTank()));
        return response;
    }

    private Map<String, Object> extractTankData(Tank tank) {
        Map<String, Object> data = new HashMap<>();
        data.put("currentLevel", tank.getCurrentLevel());
        data.put("heaterOn", tank.isHeaterOn());
        data.put("mixerOn", tank.isMixerOn());
        data.put("inputValveOpen", tank.getInputValve().isOpen());
        data.put("outputValveOpen", tank.getOutputValve().isOpen());
        data.put("lowSensor", tank.isLowLevelSensorTriggered());
        data.put("highSensor", tank.isHighLevelSensorTriggered());
        return data;
    }

    @PostMapping("/start")
    public void startProcess(@RequestParam String recipe) {
        simulatorService.startProcess(recipe);
    }

    // НОВИЙ ЕНДПОІНТ
    @PostMapping("/stop")
    public void stopProcess() {
        simulatorService.stopProcess();
    }

    // Скидання стану з DONE назад в IDLE після закриття модалки
    @PostMapping("/reset")
    public void resetProcess() {
        simulatorService.stopProcess();
    }
    @PostMapping("/tick")
    public void processTick() { simulatorService.processTick(); }
}