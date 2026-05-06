package com.beegeo.common.security;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.beegeo.asset.controller.AssetController;
import com.beegeo.auth.domain.UserRole;
import com.beegeo.keyword.controller.KeywordController;
import com.beegeo.knowledge.controller.KnowledgeController;
import com.beegeo.persona.controller.PersonaController;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;

class ControllerPermissionCoverageTest {
    private static final UserRole[] CONTENT_WRITE_ROLES = {UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN};

    @Test
    void shouldProtectContentConfigurationMutations() throws NoSuchMethodException {
        assertRoles(KeywordController.class.getDeclaredMethod("create", KeywordController.KeywordRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(KeywordController.class.getDeclaredMethod("update", Long.class, KeywordController.KeywordRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(KeywordController.class.getDeclaredMethod("delete", Long.class), CONTENT_WRITE_ROLES);

        assertRoles(KnowledgeController.class.getDeclaredMethod("create", KnowledgeController.KnowledgeRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(KnowledgeController.class.getDeclaredMethod("update", Long.class, KnowledgeController.KnowledgeRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(KnowledgeController.class.getDeclaredMethod("delete", Long.class), CONTENT_WRITE_ROLES);

        assertRoles(AssetController.class.getDeclaredMethod("create", AssetController.AssetRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(AssetController.class.getDeclaredMethod("update", Long.class, AssetController.AssetRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(AssetController.class.getDeclaredMethod("delete", Long.class), CONTENT_WRITE_ROLES);

        assertRoles(PersonaController.class.getDeclaredMethod("create", PersonaController.PersonaRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(PersonaController.class.getDeclaredMethod("update", Long.class, PersonaController.PersonaRequest.class), CONTENT_WRITE_ROLES);
        assertRoles(PersonaController.class.getDeclaredMethod("delete", Long.class), CONTENT_WRITE_ROLES);
        assertRoles(PersonaController.class.getDeclaredMethod("generate", PersonaController.GeneratePersonaRequest.class), CONTENT_WRITE_ROLES);
    }

    private void assertRoles(Method method, UserRole[] expectedRoles) {
        RequireRole requireRole = method.getAnnotation(RequireRole.class);
        assertNotNull(requireRole, method.getName() + " 缺少角色权限注解");
        assertArrayEquals(expectedRoles, requireRole.value(), method.getName() + " 角色权限不符合预期");
    }
}
