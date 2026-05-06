package com.beegeo.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.beegeo.common.api.ApiResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class PermissionMatrixControllerTest {
    private final PermissionMatrixController controller = new PermissionMatrixController(new PermissionMatrixApplicationService());

    @Test
    void shouldListPermissionMatrix() {
        ApiResponse<List<PermissionMatrixView>> response = controller.list(null, null, null);

        assertTrue(response.success());
        assertEquals(8, response.data().size());
        assertTrue(response.data().stream()
            .anyMatch(item -> item.permission().equals("PUBLISH_EXECUTE") && item.module().equals("发布中心")));
    }

    @Test
    void shouldFilterPermissionMatrixByRoleAndRiskLevel() {
        ApiResponse<List<PermissionMatrixView>> response = controller.list(null, "PUBLISHER", "高");

        assertTrue(response.success());
        assertEquals(2, response.data().size());
        assertTrue(response.data().stream().anyMatch(item -> item.permission().equals("CREDENTIAL_MANAGE")));
        assertTrue(response.data().stream().anyMatch(item -> item.permission().equals("PUBLISH_EXECUTE")));
    }
}
